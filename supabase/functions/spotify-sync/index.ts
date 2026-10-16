// Haalt per gekoppelde gebruiker de recent gespeelde nummers op en bewaart ze
// in `plays`. Spotify geeft er maximaal 50 per keer, dus dit draait elk uur
// (pg_cron, zie supabase/cron.sql). Beveiligd met CRON_SECRET.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

interface TokenRow {
  user_id: string;
  refresh_token: string;
  access_token: string | null;
  expires_at: string | null;
  last_played_at: string | null;
}

interface SpotifyImage { url: string; width: number | null }
interface RecentItem {
  played_at: string;
  track: {
    id: string;
    name: string;
    duration_ms: number;
    artists: { id: string; name: string }[];
    album: { images: SpotifyImage[] };
  } | null;
}

class SpotifyAuthError extends Error {}

async function accessToken(admin: SupabaseClient, t: TokenRow): Promise<string> {
  if (t.access_token && t.expires_at && new Date(t.expires_at).getTime() > Date.now()) return t.access_token;

  const id = Deno.env.get('SPOTIFY_CLIENT_ID')!;
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')!;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${btoa(`${id}:${secret}`)}` },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh_token }),
  });
  if (res.status === 400 || res.status === 401) throw new SpotifyAuthError(await res.text());
  if (!res.ok) throw new Error(`refresh ${res.status}`);
  const tok = await res.json();
  await admin
    .from('spotify_tokens')
    .update({
      access_token: tok.access_token,
      refresh_token: tok.refresh_token ?? t.refresh_token,
      expires_at: new Date(Date.now() + (tok.expires_in - 60) * 1000).toISOString(),
    })
    .eq('user_id', t.user_id);
  return tok.access_token;
}

/** Kleinste hoes van minstens 64 px. */
function cover(images: SpotifyImage[]): string | null {
  const ok = images.filter(i => (i.width ?? 0) >= 64).sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return ok[0]?.url ?? images[0]?.url ?? null;
}

async function syncUser(admin: SupabaseClient, t: TokenRow): Promise<number> {
  try {
    const token = await accessToken(admin, t);
    const params = new URLSearchParams({ limit: '50' });
    if (t.last_played_at) params.set('after', String(new Date(t.last_played_at).getTime()));
    const res = await fetch(`https://api.spotify.com/v1/me/player/recently-played?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) throw new SpotifyAuthError(await res.text());
    if (!res.ok) throw new Error(`recently-played ${res.status}`);
    const data = (await res.json()) as { items: RecentItem[] };

    const rows = data.items
      .filter(i => i.track && i.track.id)
      .map(i => ({
        user_id: t.user_id,
        played_at: i.played_at,
        track_id: i.track!.id,
        track_name: i.track!.name,
        artist_id: i.track!.artists[0]?.id ?? null,
        artist_name: i.track!.artists[0]?.name ?? 'Onbekend',
        image_url: cover(i.track!.album.images),
        duration_ms: i.track!.duration_ms,
      }));

    if (rows.length) {
      const { error } = await admin.from('plays').upsert(rows, { onConflict: 'user_id,played_at', ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    const latest = rows.reduce<string | null>((m, r) => (!m || r.played_at > m ? r.played_at : m), t.last_played_at);
    await admin
      .from('spotify_tokens')
      .update({ last_played_at: latest, last_sync_at: new Date().toISOString(), last_error: null })
      .eq('user_id', t.user_id);
    return rows.length;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('sync', t.user_id, msg);
    await admin.from('spotify_tokens').update({ last_error: msg.slice(0, 500), last_sync_at: new Date().toISOString() }).eq('user_id', t.user_id);
    // Toestemming ingetrokken: laat de app weer "Spotify koppelen" tonen.
    if (e instanceof SpotifyAuthError) await admin.from('profiles').update({ spotify_connected: false }).eq('id', t.user_id);
    return -1;
  }
}

Deno.serve(async req => {
  const secret = Deno.env.get('CRON_SECRET');
  const auth = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || auth !== secret) return new Response('nee', { status: 401 });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({}));

  let query = admin.from('spotify_tokens').select('user_id, refresh_token, access_token, expires_at, last_played_at');
  if (typeof body.userId === 'string') query = query.eq('user_id', body.userId);
  const { data, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const result: Record<string, number> = {};
  for (const t of (data ?? []) as TokenRow[]) result[t.user_id] = await syncUser(admin, t);
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
});
