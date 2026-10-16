import { useMemo } from 'react';
import { useBackend, useLive } from '../../data/context';
import type { Task } from '../../data/types';
import { ymd } from '../../lib/dates';
import type { PlantView } from './PlantsCard';
import { PLANT_IDS, WATERED_PCT, dailyTasks, estimateMoisture, mergeTasks, plantStatus, type WeatherFacts } from './plantRules';

export function usePlants(now: Date, weather: WeatherFacts | null) {
  const backend = useBackend();
  const date = ymd(now);
  const plants = useLive(['plants'], b => b.listPlants());
  const stored = useLive(['tasks'], b => b.listTasks(date), date);
  const maxTemp = weather?.maxToday ?? null;

  const views = useMemo<PlantView[]>(() => {
    if (!plants.data) return [];
    const list = PLANT_IDS.flatMap(id => plants.data!.filter(p => p.id === id));
    const moist = list.map(p => ({ id: p.id, moisture: estimateMoisture(p, now, maxTemp) }));
    const tasks = mergeTasks(dailyTasks(date, now, moist, weather), stored.data ?? [], date);
    return list.map((p, i) => {
      const own = tasks.filter(t => t.plantId === p.id);
      return {
        id: p.id,
        name: p.name,
        place: p.place,
        moisture: moist[i].moisture,
        status: plantStatus(moist[i].moisture, own.filter(t => !t.done)),
        tasks: own,
      };
    });
  }, [plants.data, stored.data, date, now, maxTemp, weather]);

  async function toggle(task: Task) {
    const done = !task.done;
    const next: Task = { ...task, done };
    const plant = plants.data?.find(p => p.id === task.plantId);

    // Water geven zet de vochtigheid weer op peil; ongedaan maken zet hem terug.
    if (task.kind === 'water' && plant) {
      if (done) {
        next.prevMoisturePct = plant.moisturePct;
        next.prevMoistureAt = plant.moistureAt;
        const patch = { moisturePct: WATERED_PCT, moistureAt: new Date().toISOString() };
        plants.set(prev => prev?.map(p => (p.id === plant.id ? { ...p, ...patch } : p)) ?? prev);
        await backend.updatePlant(plant.id, patch);
      } else if (task.prevMoisturePct != null && task.prevMoistureAt) {
        const patch = { moisturePct: task.prevMoisturePct, moistureAt: task.prevMoistureAt };
        plants.set(prev => prev?.map(p => (p.id === plant.id ? { ...p, ...patch } : p)) ?? prev);
        await backend.updatePlant(plant.id, patch);
      }
    }

    stored.set(prev => [...(prev ?? []).filter(t => t.id !== next.id), next]);
    try {
      await backend.saveTask(next);
    } catch (e) {
      console.error(e);
      stored.reload();
      plants.reload();
    }
  }

  return {
    plants: views,
    raw: plants.data ?? [],
    loading: plants.loading || stored.loading,
    error: plants.error ?? stored.error,
    toggle,
    retry: () => {
      plants.reload();
      stored.reload();
    },
    addDefaults: () => backend.addDefaultPlants(),
    setMoisture: (id: PlantView['id'], pct: number) =>
      backend.updatePlant(id, { moisturePct: pct, moistureAt: new Date().toISOString() }),
  };
}
