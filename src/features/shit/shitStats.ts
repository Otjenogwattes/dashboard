import { addDays, mondayOf, startOfDay, weekdayIndex } from '../../lib/dates';
import { nl } from '../../lib/format';
import type { Poop } from '../../data/types';

export interface PersonShit {
  /** Aantal per dag, ma–zo. */
  week: number[];
  today: number;
  /** Gemiddeld cijfer van vandaag, "7,0" of "–". */
  avg: string;
  weekTotal: number;
}

export function personShit(poops: Poop[], userId: string, now: Date): PersonShit {
  const monday = mondayOf(now).getTime();
  const nextMonday = addDays(mondayOf(now), 7).getTime();
  const todayStart = startOfDay(now).getTime();
  const mine = poops.filter(p => p.userId === userId);

  const week = [0, 0, 0, 0, 0, 0, 0];
  for (const p of mine) {
    const t = new Date(p.createdAt);
    if (t.getTime() >= monday && t.getTime() < nextMonday) week[weekdayIndex(t)]++;
  }

  const todays = mine.filter(p => new Date(p.createdAt).getTime() >= todayStart);
  const grades = todays.map(p => p.grade).filter((g): g is number => g != null);
  return {
    week,
    today: todays.length,
    avg: grades.length ? nl(grades.reduce((a, b) => a + b, 0) / grades.length) : '–',
    weekTotal: week.reduce((a, b) => a + b, 0),
  };
}

/** "Gelijkspel deze week." / "Jij staat 1 voor." / "Nikki staat 2 voor." */
export function leadText(me: number, her: number, herName: string): string {
  if (me === her) return 'Gelijkspel deze week.';
  return `${me > her ? 'Jij' : herName} staat ${Math.abs(me - her)} voor.`;
}

/** De meest recente keer van vandaag, voor "oeps". */
export function lastToday(poops: Poop[], userId: string, now: Date): Poop | null {
  const todayStart = startOfDay(now).getTime();
  return (
    poops
      .filter(p => p.userId === userId && new Date(p.createdAt).getTime() >= todayStart)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  );
}
