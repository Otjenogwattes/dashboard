import { nl } from '../../lib/format';
import type { Play } from '../../data/types';

export interface DuetArtist {
  name: string;
  me: number;
  her: number;
}

export interface TopTrack {
  title: string;
  artist: string;
  plays: number;
  imageUrl: string | null;
}

export interface DuetStats {
  meHours: string;
  herHours: string;
  /** Overlap van artiesten, gewogen naar aantal keer gedraaid. */
  samenPct: number;
  artists: DuetArtist[];
  max: number;
  me: TopTrack | null;
  samen: TopTrack | null;
  her: TopTrack | null;
  mePlays: number;
  herPlays: number;
}

type Counts = Map<string, number>;

function countBy(plays: Play[], key: (p: Play) => string): Counts {
  const m: Counts = new Map();
  for (const p of plays) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
  return m;
}

function hours(plays: Play[]): string {
  return nl(plays.reduce((a, p) => a + p.durationMs, 0) / 3600000);
}

/**
 * Samen % = 2 · Σ min(jij, zij) / (Σ jij + Σ zij) over alle artiesten.
 * 0% als jullie niets gemeen hebben, 100% als jullie precies hetzelfde draaien.
 */
export function samenPct(me: Counts, her: Counts): number {
  let overlap = 0;
  let total = 0;
  for (const n of me.values()) total += n;
  for (const n of her.values()) total += n;
  for (const [a, n] of me) overlap += Math.min(n, her.get(a) ?? 0);
  return total ? Math.round((2 * overlap) / total * 100) : 0;
}

export function computeDuet(plays: Play[], meId: string, herId: string | null, artistLimit = 5): DuetStats {
  const mine = plays.filter(p => p.userId === meId);
  const hers = herId ? plays.filter(p => p.userId === herId) : [];
  const meA = countBy(mine, p => p.artistName);
  const herA = countBy(hers, p => p.artistName);

  // Rangschik op aandeel per persoon, zodat jullie allebei evenveel meetellen.
  const meTotal = mine.length || 1;
  const herTotal = hers.length || 1;
  const names = new Set([...meA.keys(), ...herA.keys()]);
  const artists = [...names]
    .map(name => ({ name, me: meA.get(name) ?? 0, her: herA.get(name) ?? 0 }))
    .sort((a, b) => b.me / meTotal + b.her / herTotal - (a.me / meTotal + a.her / herTotal) || a.name.localeCompare(b.name))
    .slice(0, artistLimit);

  const trackKey = (p: Play) => p.trackId;
  const meT = countBy(mine, trackKey);
  const herT = countBy(hers, trackKey);
  const info = new Map<string, Play>();
  for (const p of plays) if (!info.has(p.trackId) || (!info.get(p.trackId)!.imageUrl && p.imageUrl)) info.set(p.trackId, p);
  const toTrack = (id: string, n: number): TopTrack => {
    const p = info.get(id)!;
    return { title: p.trackName, artist: p.artistName, plays: n, imageUrl: p.imageUrl };
  };
  const top = (c: Counts, skip?: string) =>
    [...c].filter(([id]) => id !== skip).sort((a, b) => b[1] - a[1])[0];

  const shared = [...meT].filter(([id]) => herT.has(id)).map(([id, n]) => [id, n + herT.get(id)!] as [string, number]);
  const samenTop = shared.sort((a, b) => b[1] - a[1])[0];
  const meTop = top(meT, samenTop?.[0]) ?? top(meT);
  const herTop = top(herT, samenTop?.[0]) ?? top(herT);

  return {
    meHours: hours(mine),
    herHours: hours(hers),
    samenPct: samenPct(meA, herA),
    artists,
    max: Math.max(1, ...artists.flatMap(a => [a.me, a.her])),
    me: meTop ? toTrack(...meTop) : null,
    samen: samenTop ? toTrack(...samenTop) : null,
    her: herTop ? toTrack(...herTop) : null,
    mePlays: mine.length,
    herPlays: hers.length,
  };
}
