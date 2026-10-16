/*
 * Voorbeelddata uit het ontwerp (README + Balkon.dc.html). Wordt gebruikt in
 * demo-modus, als er geen Supabase is ingesteld.
 */
import { addDays, mondayOf, startOfDay, weekdayIndex } from '../lib/dates';
import type { CurrentWeather, HourPoint } from '../features/weather/weather';
import type { Play, Poop, Profile } from './types';

export const DEMO_ME: Profile = { id: 'demo-jij', name: 'Ik', spotifyConnected: true };
export const DEMO_HER: Profile = { id: 'demo-nikki', name: 'Nikki', spotifyConnected: true };

/** Temperatuur 06:00 vandaag … 09:00 morgen, regenkans per uur. */
const TEMPS = [4, 4, 5, 6, 8, 9, 10, 11, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 0, 0, -1, -1, -1, 0, 1, 2];
const RAIN = [5, 5, 5, 10, 10, 15, 20, 35, 60, 60, 55, 40, 25, 15, 10, 10, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];

export function mockWeather(): { hours: HourPoint[]; current: CurrentWeather } {
  const hours: HourPoint[] = TEMPS.map((temp, i) => {
    const t = 6 + i;
    return { t, temp, feels: temp - 3, rain: RAIN[i], wind: 15, code: RAIN[i] >= 50 ? 80 : 3 };
  });
  return { hours, current: { temp: 11, feels: 9, wind: 15, code: 3, isDay: true } };
}

/** Shit counter: ma–do uit het ontwerp, vandaag 1 keer elk (cijfer 7 en 8). */
export function mockPoops(now: Date): Poop[] {
  const me = [2, 1, 1, 2];
  const her = [1, 1, 2, 1];
  const monday = mondayOf(now);
  const todayIdx = weekdayIndex(now);
  const out: Poop[] = [];
  const add = (userId: string, day: Date, n: number, grade: number | null) => {
    for (let i = 0; i < n; i++) {
      const t = new Date(day);
      t.setHours(8 + i * 5, 10 + i * 7);
      out.push({ id: `${userId}-${t.toISOString()}`, userId, createdAt: t.toISOString(), grade });
    }
  };
  for (let d = 0; d < todayIdx && d < 4; d++) {
    add(DEMO_ME.id, addDays(monday, d), me[d], 7);
    add(DEMO_HER.id, addDays(monday, d), her[d], 7);
  }
  const today = startOfDay(now);
  add(DEMO_ME.id, today, 1, 7);
  add(DEMO_HER.id, today, 1, 8);
  return out;
}

type TrackSpec = [title: string, plays: number];

const ME_PLAYS: Record<string, TrackSpec[]> = {
  'Altin Gün': [['Goca Dünya', 18], ['Cemalım', 16], ['Kalk Gidelim', 15], ['Yüce Dağ Başında', 15]],
  Khruangbin: [['Maria También', 14], ['Time (You and I)', 14], ['People Everywhere', 13]],
  Froukje: [['Groter dan ik', 9], ['Ik wil dansen', 10], ['Licht en donker', 10]],
  'Maggie Rogers': [['Alaska', 6]],
};

const HER_PLAYS: Record<string, TrackSpec[]> = {
  Froukje: [['Groter dan ik', 12], ['Ik wil dansen', 8], ['Licht en donker', 11], ['Onbezonnen', 11], ['Zonder jou', 10]],
  'Maggie Rogers': [['Love You For A Long Time', 14], ['Alaska', 12], ['Light On', 12]],
  'Pommelien Thijs': [['Atlas', 11], ['Erop of eronder', 10], ['Toegegeven', 10]],
  Khruangbin: [['Maria También', 6], ['Texas Sun', 6]],
};

function playsFor(userId: string, spec: Record<string, TrackSpec[]>, totalHours: number, now: Date): Play[] {
  const flat = Object.entries(spec).flatMap(([artist, tracks]) =>
    tracks.flatMap(([title, n]) => Array.from({ length: n }, () => ({ artist, title }))),
  );
  const durationMs = Math.round((totalHours * 3600000) / flat.length);
  return flat.map((x, i) => ({
    userId,
    playedAt: new Date(now.getTime() - ((i * 37) % (7 * 24 * 60)) * 60000).toISOString(),
    trackId: `${x.artist}:${x.title}`,
    trackName: x.title,
    artistName: x.artist,
    imageUrl: null,
    durationMs,
  }));
}

export function mockPlays(now: Date): Play[] {
  return [...playsFor(DEMO_ME.id, ME_PLAYS, 18.4, now), ...playsFor(DEMO_HER.id, HER_PLAYS, 14.2, now)];
}
