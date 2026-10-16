const DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MONTHS = ['jan.', 'feb.', 'mrt.', 'apr.', 'mei', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
const MONTHS_UPPER = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];

/** Weekdagletters ma–zo voor grafieken. */
export const WEEK_LETTERS = ['m', 'd', 'w', 'd', 'v', 'z', 'z'];

export const dayName = (d: Date) => DAYS[d.getDay()];
export const monthShort = (d: Date) => MONTHS[d.getMonth()];

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Maandag 00:00 van de week waarin `d` valt. */
export function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  return addDays(x, -((x.getDay() + 6) % 7));
}

/** 0 = maandag … 6 = zondag */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

/** ISO-weeknummer. */
export function isoWeek(d: Date): number {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Lokale datum als YYYY-MM-DD. */
export function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 6) return 'Goedenacht.';
  if (h < 12) return 'Goedemorgen.';
  if (h < 18) return 'Goedemiddag.';
  return 'Goedenavond.';
}

/** "10–16 OKT" of "28 SEP – 4 OKT" */
export function rangeLabel(from: Date, to: Date): string {
  if (from.getMonth() === to.getMonth()) return `${from.getDate()}–${to.getDate()} ${MONTHS_UPPER[to.getMonth()]}`;
  return `${from.getDate()} ${MONTHS_UPPER[from.getMonth()]} – ${to.getDate()} ${MONTHS_UPPER[to.getMonth()]}`;
}

/** Uren sinds vandaag 00:00 (lokaal), met fractie. */
export function hoursSinceMidnight(t: Date, today: Date = t): number {
  return (t.getTime() - startOfDay(today).getTime()) / 3600000;
}
