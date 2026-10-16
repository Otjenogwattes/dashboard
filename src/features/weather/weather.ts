import { capitalize, temp as fmtTemp } from '../../lib/format';

/** Eén uur uit de verwachting. `t` = uren sinds vandaag 00:00 (dus 30 = morgen 06:00). */
export interface HourPoint {
  t: number;
  temp: number;
  feels: number;
  /** Neerslagkans in procenten. */
  rain: number;
  /** Wind in km/u. */
  wind: number;
  code: number;
}

export interface CurrentWeather {
  temp: number;
  feels: number;
  wind: number;
  code: number;
  isDay: boolean;
}

export interface ClothingPin {
  hour: number;
  time: string;
  title: string;
  sub: string;
}

export interface WeatherView {
  current: CurrentWeather;
  /** "Bewolkt, middag buien" */
  summary: string;
  /** "Buien" (mobiel) */
  short: string;
  /** Hoogste regenkans voor de rest van de dag. */
  rainToday: number;
  bft: number;
  /** 25 punten: 06:00 vandaag t/m 06:00 morgen. */
  line: HourPoint[];
  /** 24 regenkansen, één per uur vanaf 06:00. */
  rainBars: number[];
  pins: ClothingPin[];
  nightMin: number;
  frost: boolean;
  maxToday: number;
  /** Uren sinds middernacht, of null als het nu buiten 06:00–06:00 valt. */
  nowT: number | null;
}

export const CLOTHING_SLOTS = [8, 14, 20] as const;

/** Beaufort uit km/u. */
export function beaufort(kmh: number): number {
  const limits = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  const i = limits.findIndex(l => kmh < l);
  return i === -1 ? 12 : i;
}

const isWet = (code: number) => code >= 51;

export function describe(code: number, isDay = true): string {
  if (code === 0) return isDay ? 'Zonnig' : 'Helder';
  if (code === 1) return isDay ? 'Overwegend zonnig' : 'Overwegend helder';
  if (code === 2) return 'Halfbewolkt';
  if (code === 3) return 'Bewolkt';
  if (code === 45 || code === 48) return 'Mist';
  if (code >= 51 && code <= 57) return 'Motregen';
  if (code === 66 || code === 67) return 'IJzel';
  if (code >= 61 && code <= 65) return code === 65 ? 'Zware regen' : 'Regen';
  if (code >= 71 && code <= 77) return 'Sneeuw';
  if (code >= 80 && code <= 82) return 'Buien';
  if (code === 85 || code === 86) return 'Sneeuwbuien';
  if (code >= 95) return 'Onweer';
  return 'Wisselend';
}

/** Kort woord voor neerslag later op de dag. */
function wetWord(code: number): string {
  if (code >= 95) return 'onweer';
  if (code >= 71 && code <= 77) return 'sneeuw';
  if (code >= 85 && code <= 86) return 'sneeuwbuien';
  if (code >= 51 && code <= 57) return 'motregen';
  if (code >= 61 && code <= 67) return 'regen';
  return 'buien';
}

const DAYPARTS: { name: string; from: number; to: number }[] = [
  { name: 'ochtend', from: 6, to: 12 },
  { name: 'middag', from: 12, to: 18 },
  { name: 'avond', from: 18, to: 24 },
];

/** Kledingadvies op gevoelstemperatuur en regenkans. */
export function clothingFor(slot: number, p: HourPoint, ctx: { frost: boolean; eveningLow: number }): { title: string; sub: string } {
  if (p.rain >= 50) return { title: 'Regenjas, dichte schoenen', sub: `${Math.round(p.rain)}% kans op buien` };
  if (slot >= 20 && ctx.frost) return { title: 'Handschoenen', sub: 'basilicum binnenzetten' };

  const f = p.feels;
  const title =
    f <= 0 ? 'Muts en handschoenen'
    : f <= 8 ? 'Trui of fleece'
    : f <= 14 ? 'Vest mee'
    : f <= 20 ? 'Lange mouwen'
    : f <= 26 ? 'T-shirt'
    : 'Luchtig, zoek de schaduw';

  if (p.rain >= 30) return { title, sub: `${Math.round(p.rain)}% kans op regen, paraplu mee` };
  if (slot >= 20) return { title, sub: `koelt af naar ${fmtTemp(ctx.eveningLow)}°` };
  return { title, sub: `${fmtTemp(p.temp)}°, voelt als ${fmtTemp(p.feels)}°` };
}

/**
 * Bouwt alles wat de weerkaart nodig heeft uit een uurverwachting.
 * `hours` moet minstens t = 6 … 33 bevatten (tot morgen 09:00, voor het nachtminimum).
 */
export function buildWeatherView(hours: HourPoint[], current: CurrentWeather, nowT: number): WeatherView {
  const at = (t: number) => hours.find(h => h.t === t) ?? hours.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
  const line = hours.filter(h => h.t >= 6 && h.t <= 30);
  const rainBars = line.filter(h => h.t < 30).map(h => h.rain);

  const night = hours.filter(h => h.t >= 18 && h.t <= 33);
  const nightMin = Math.min(...night.map(h => h.temp));
  const frost = Math.round(nightMin) <= 0;
  const day = hours.filter(h => h.t >= 6 && h.t < 24);
  const maxToday = Math.max(...day.map(h => h.temp));

  const rest = hours.filter(h => h.t >= Math.floor(nowT) && h.t < 24);
  const rainToday = Math.max(0, ...(rest.length ? rest : day).map(h => h.rain));

  // Samenvatting: het weer van nu, plus neerslag die later vandaag komt.
  const base = describe(current.code, current.isDay);
  let later: string | null = null;
  if (!isWet(current.code)) {
    for (const part of DAYPARTS) {
      if (part.to <= nowT) continue;
      const span = hours.filter(h => h.t >= Math.max(part.from, Math.floor(nowT)) && h.t < part.to);
      const wet = span.filter(h => isWet(h.code) || h.rain >= 50);
      if (wet.length) {
        const worst = wet.reduce((a, b) => (b.code > a.code ? b : a));
        later = `${part.from <= nowT ? 'straks' : part.name} ${wetWord(isWet(worst.code) ? worst.code : 80)}`;
        break;
      }
    }
  }
  const summary = later ? `${base}, ${later}` : base;
  const short = later ? capitalize(later.split(' ').slice(1).join(' ')) : base;

  const eveningLow = Math.min(...hours.filter(h => h.t >= 21 && h.t <= 23).map(h => h.temp));
  const pins: ClothingPin[] = CLOTHING_SLOTS.map(slot => ({
    hour: slot,
    time: `${String(slot).padStart(2, '0')}:00`,
    ...clothingFor(slot, at(slot), { frost, eveningLow }),
  }));

  return {
    current,
    summary,
    short,
    rainToday,
    bft: beaufort(current.wind),
    line,
    rainBars,
    pins,
    nightMin,
    frost,
    maxToday,
    nowT: nowT >= 6 && nowT <= 30 ? nowT : null,
  };
}
