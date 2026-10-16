import type { PlantStatus } from '../../components/Pill';
import type { Plant, PlantId, Task, TaskKind } from '../../data/types';

/*
 * Regels voor de twee balkonplanten. Er is geen vochtsensor: de vochtigheid
 * is een schatting die na "Water geven" op WATERED_PCT springt en daarna per
 * dag uitdroogt, sneller als het warm is. Je kunt hem in Planten corrigeren.
 */

export const PLANT_IDS: PlantId[] = ['tomaat', 'basilicum'];

export const DEFAULT_PLANTS: Plant[] = [
  { id: 'tomaat', name: 'Tomaat', place: 'balkon zuid', moisturePct: 30, moistureAt: new Date().toISOString() },
  { id: 'basilicum', name: 'Basilicum', place: 'pot bij de deur', moisturePct: 40, moistureAt: new Date().toISOString() },
];

export const WATERED_PCT = 90;

/** Uitdroging in procentpunten per dag bij 18 °C. */
const DRY_PER_DAY: Record<PlantId, number> = { tomaat: 14, basilicum: 10 };

const WATER_DETAIL: Record<PlantId, string> = { tomaat: 'ca. 1 liter', basilicum: 'scheutje op de schotel' };

export function estimateMoisture(plant: Plant, now: Date, maxTemp: number | null): number {
  const days = Math.max(0, (now.getTime() - new Date(plant.moistureAt).getTime()) / 86400000);
  const heat = maxTemp == null ? 1 : Math.min(2, Math.max(0.5, maxTemp / 18));
  return Math.max(0, Math.min(100, Math.round(plant.moisturePct - days * DRY_PER_DAY[plant.id] * heat)));
}

export interface WeatherFacts {
  frost: boolean;
  nightMin: number;
  maxToday: number;
}

export interface TaskSeed {
  id: string;
  plantId: PlantId;
  kind: TaskKind;
  title: string;
  detail: string;
}

export const taskId = (date: string, plantId: PlantId, kind: TaskKind) => `${date}:${plantId}:${kind}`;

/** Welke taken vandaag gelden, in weergavevolgorde. */
export function dailyTasks(date: string, now: Date, plants: { id: PlantId; moisture: number }[], weather: WeatherFacts | null): TaskSeed[] {
  const out: TaskSeed[] = [];
  const seed = (plantId: PlantId, kind: TaskKind, title: string, detail: string) =>
    out.push({ id: taskId(date, plantId, kind), plantId, kind, title, detail });

  for (const p of plants) {
    if (p.id === 'basilicum' && weather?.frost) seed(p.id, 'binnen', 'Voor 20:00 naar binnen', 'vorst vannacht');
    if (p.moisture < 50) seed(p.id, 'water', 'Water geven', WATER_DETAIL[p.id]);
    // Najaar: zodra de nachten koud worden, de laatste tomaten binnenhalen.
    const month = now.getMonth();
    if (p.id === 'tomaat' && month >= 8 && month <= 10 && weather && weather.nightMin <= 5) {
      seed(p.id, 'oogst', 'Laatste tomaten plukken', 'groene laten narijpen');
    }
  }
  return out;
}

/**
 * Taken voor vandaag: wat de regels nu zeggen, plus wat vandaag al is afgevinkt
 * (zodat "Water geven" blijft staan nadat de plant water kreeg).
 */
export function mergeTasks(seeds: TaskSeed[], stored: Task[], date: string): Task[] {
  const byId = new Map(stored.filter(t => t.date === date).map(t => [t.id, t]));
  const out: Task[] = seeds.map(s => ({ ...s, date, done: byId.get(s.id)?.done ?? false, prevMoisturePct: byId.get(s.id)?.prevMoisturePct, prevMoistureAt: byId.get(s.id)?.prevMoistureAt }));
  for (const t of byId.values()) if (t.done && !out.some(o => o.id === t.id)) out.push(t);
  const order: Record<TaskKind, number> = { binnen: 0, water: 1, oogst: 2 };
  return out.sort((a, b) => PLANT_IDS.indexOf(a.plantId) - PLANT_IDS.indexOf(b.plantId) || order[a.kind] - order[b.kind]);
}

export function plantStatus(moisture: number, openTasks: Task[]): PlantStatus {
  if (openTasks.some(t => t.kind === 'binnen') || moisture < 25) return 'actie';
  if (moisture < 50) return 'droog';
  return 'ok';
}

/** Tweede zin van de begroeting. */
export function heroLine(weather: WeatherFacts | null, tasks: Task[] | null): string {
  if (!tasks) return weather?.frost ? 'Vannacht vriest het, dus de basilicum gaat naar binnen.' : 'Even kijken wat het balkon nodig heeft.';
  const open = tasks.filter(t => !t.done);
  if (open.some(t => t.kind === 'binnen')) return 'Vannacht vriest het, dus de basilicum gaat naar binnen.';
  if (weather?.frost) return 'Vannacht vriest het, maar de basilicum staat al binnen.';
  if (open.some(t => t.kind === 'water')) return 'Rustige dag, alleen water geven.';
  if (open.length) return 'Rustige dag op het balkon.';
  if (tasks.length) return 'Alles is gedaan. Lekker bezig.';
  return 'Niets te doen op het balkon vandaag.';
}
