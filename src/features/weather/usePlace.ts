import { useSyncExternalStore } from 'react';
import { UTRECHT, type Place } from './openMeteo';

/* Plaats voor het weer, per apparaat bewaard. Standaard Utrecht. */

const KEY = 'balkon.place';
const listeners = new Set<() => void>();
let cached: Place | null = null;

function load(): Place {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    const p = raw ? (JSON.parse(raw) as Place) : null;
    cached = p && typeof p.lat === 'number' && typeof p.lon === 'number' && p.name ? p : UTRECHT;
  } catch {
    cached = UTRECHT;
  }
  return cached;
}

export function setPlace(p: Place) {
  cached = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* alleen voor deze sessie */
  }
  listeners.forEach(l => l());
}

export function usePlace(): Place {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => UTRECHT,
  );
}
