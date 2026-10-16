// Spotify stuurt de gebruiker hierheen na toestemming. We wisselen de code in
// voor tokens, bewaren de refresh token, halen meteen de eerste nummers op en
// sturen de gebruiker terug naar de app.
import { createClient } from 'npm:@supabase/supabase-js@2';

const back = (to: string, result: string) => Response.redirect(`${to.replace(/\/$/, '')}/?spotify=${result}`, 302);

Deno.serve(async req => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const denied = url.searchParams.get('error');
  const fallback = (Deno.env.get('APP_URL') ?? '').split(',')[0]?.trim() || 'https://spotify.com';

  if (!state) return back(fallback, 'fout');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  const { data: row } = await admin.from('spotify_oauth_states').select('*').eq('state', state).maybeSingle();
  if (!row) return back(fallback, 'fout');
  await admin.from('spotify_oauth_states').delete().eq('state', state);

  const returnTo = row.return_to as string;
  if (denied) return back(returnTo, 'geweigerd');
  if (!code || Date.now() - new Date(row.created_at).getTime() > 15 * 60_000) return back(returnTo, 'fout');

  const id = Deno.env.get('SPOTIFY_CLIENT_ID')!;
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')!;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${supabaseUrl}/functions/v1/spotify-callback`,
    }),
  });
  if (!res.ok) {
    console.error('token exchange', res.status, await res.text());
    return back(returnTo, 'fout');
  }
  const tok = await res.json();

  const { error } = await admin.from('spotify_tokens').upsert({
    user_id: row.user_id,
    refresh_token: tok.refresh_token,
    access_token: tok.access_token,
    expires_at: new Date(Date.now() + (tok.expires_in - 60) * 1000).toISOString(),
    last_error: null,
  });
  if (error) {
    console.error(error);
    return back(returnTo, 'fout');
  }
  await admin.from('profiles').update({ spotify_connected: true }).eq('id', row.user_id);

  // Eerste nummers meteen ophalen, zodat er niet een uur niets staat.
  await fetch(`${supabaseUrl}/functions/v1/spotify-sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('CRON_SECRET')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: row.user_id }),
  }).catch(e => console.error('initial sync', e));

  return back(returnTo, 'ok');
});
