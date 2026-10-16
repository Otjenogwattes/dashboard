// Start de Spotify-koppeling (geeft de autorisatie-URL terug) of ontkoppelt.
// Aangeroepen vanuit de app met de sessie van de ingelogde gebruiker.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SCOPES = 'user-read-recently-played user-top-read';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Alleen terugsturen naar de eigen app (APP_URL, komma-gescheiden voor meerdere). */
function safeReturnTo(requested: unknown): string {
  const allowed = (Deno.env.get('APP_URL') ?? '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
  const r = typeof requested === 'string' ? requested.replace(/\/$/, '') : '';
  if (allowed.includes(r)) return r;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(r)) return r;
  return allowed[0] ?? r;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const { data: userData } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (!user) return json({ error: 'Niet ingelogd' }, 401);

  const body = await req.json().catch(() => ({}));

  if (body.action === 'disconnect') {
    await admin.from('spotify_tokens').delete().eq('user_id', user.id);
    await admin.from('profiles').update({ spotify_connected: false }).eq('id', user.id);
    return json({ ok: true });
  }

  if (body.action === 'start') {
    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    if (!clientId) return json({ error: 'SPOTIFY_CLIENT_ID ontbreekt' }, 500);

    const state = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    // Oude, nooit afgemaakte pogingen opruimen.
    await admin.from('spotify_oauth_states').delete().lt('created_at', new Date(Date.now() - 3600_000).toISOString());
    const { error } = await admin.from('spotify_oauth_states').insert({ state, user_id: user.id, return_to: safeReturnTo(body.returnTo) });
    if (error) return json({ error: error.message }, 500);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/spotify-callback`,
      scope: SCOPES,
      state,
    });
    return json({ url: `https://accounts.spotify.com/authorize?${params}` });
  }

  return json({ error: 'onbekende actie' }, 400);
});
