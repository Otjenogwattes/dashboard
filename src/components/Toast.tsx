import { useEffect, useState } from 'react';

const SPOTIFY_MESSAGES: Record<string, string> = {
  ok: 'Spotify is gekoppeld. Je eerste nummers staan erin.',
  geweigerd: 'Je gaf geen toestemming in Spotify. Je kunt het later opnieuw proberen.',
  fout: 'Spotify koppelen lukte niet. Probeer het nog eens.',
};

/** Toont één keer de uitkomst van de Spotify-koppeling (?spotify=…) en haalt die uit de URL. */
export function SpotifyToast() {
  const [msg, setMsg] = useState<string | null>(() => {
    const v = new URLSearchParams(window.location.search).get('spotify');
    return v ? SPOTIFY_MESSAGES[v] ?? null : null;
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('spotify')) {
      url.searchParams.delete('spotify');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 7000);
    return () => clearTimeout(id);
  }, [msg]);

  if (!msg) return null;
  return (
    <div className="toast" role="status">
      <span>{msg}</span>
      <button type="button" className="toast__close" aria-label="Sluiten" onClick={() => setMsg(null)}>×</button>
    </div>
  );
}
