import { useState } from 'react';
import { useBackend, useLive } from '../../data/context';
import type { Poop, Profile } from '../../data/types';
import { mondayOf, weekdayIndex } from '../../lib/dates';
import type { Who } from './ShitCounter';
import { lastToday, personShit } from './shitStats';

export function useShit(now: Date, me: Profile | null, her: Profile | null) {
  const backend = useBackend();
  const since = mondayOf(now).toISOString();
  const poops = useLive(['poops'], b => b.listPoops(since), since);
  const [pending, setPending] = useState<Who | null>(null);
  const [error, setError] = useState<string | null>(null);

  const idFor = (who: Who) => (who === 'me' ? me?.id : her?.id) ?? null;
  const list = poops.data ?? [];

  async function grade(g: number | null) {
    const userId = pending && idFor(pending);
    setPending(null);
    if (!userId) return;
    const temp: Poop = { id: `tmp-${Date.now()}`, userId, grade: g, createdAt: new Date().toISOString() };
    poops.set(prev => [...(prev ?? []), temp]);
    try {
      await backend.addPoop(userId, g);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Niet opgeslagen. Controleer je verbinding.');
    }
    poops.reload();
  }

  async function dec(who: Who) {
    const userId = idFor(who);
    if (!userId) return;
    setPending(null);
    const last = lastToday(list, userId, now);
    if (!last) return;
    poops.set(prev => prev?.filter(p => p.id !== last.id) ?? prev);
    try {
      await backend.deletePoop(last.id);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Weghalen lukte niet.');
    }
    poops.reload();
  }

  return {
    me: personShit(list, me?.id ?? '', now),
    her: personShit(list, her?.id ?? '', now),
    todayIdx: weekdayIndex(now),
    pending,
    inc: (who: Who) => setPending(who),
    dec,
    grade,
    error: error ?? poops.error,
    loading: poops.loading,
  };
}
