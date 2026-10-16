import { DEFAULT_PLANTS } from '../features/plants/plantRules';
import { mondayOf, ymd } from '../lib/dates';
import type { Backend, Table } from './backend';
import { DEMO_HER, DEMO_ME, mockPlays, mockPoops } from './mock';
import type { Note, Plant, Poop, Profile, Task } from './types';

/*
 * Demo-modus: draait zonder Supabase, met de voorbeelddata uit het ontwerp.
 * Alles staat in localStorage van deze browser; andere tabbladen krijgen
 * wijzigingen mee via het storage-event.
 */

const PREFIX = 'balkon.demo.';

interface DemoState {
  seededWeek: string;
  profiles: Profile[];
  plants: Plant[];
  tasks: Task[];
  notes: Note[];
  poops: Poop[];
}

function read<K extends keyof DemoState>(key: K): DemoState[K] | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as DemoState[K]) : null;
  } catch {
    return null;
  }
}

const memory = new Map<string, unknown>();

function write<K extends keyof DemoState>(key: K, value: DemoState[K]) {
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* privévenster of opslag vol: alleen in het geheugen */
  }
}

function get<K extends keyof DemoState>(key: K): DemoState[K] {
  return (read(key) ?? memory.get(key)) as DemoState[K];
}

function seed(now: Date) {
  const week = ymd(mondayOf(now));
  if (read('seededWeek') === week) return;
  write('seededWeek', week);
  write('profiles', [DEMO_ME, DEMO_HER]);
  write('plants', DEFAULT_PLANTS.map(p => ({ ...p, moistureAt: now.toISOString() })));
  write('tasks', [
    { id: `${ymd(now)}:tomaat:oogst`, plantId: 'tomaat', kind: 'oogst', title: 'Laatste tomaten plukken', detail: 'groene laten narijpen', done: true, date: ymd(now) },
  ]);
  write('notes', []);
  write('poops', mockPoops(now));
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
const TABLE_KEYS: Table[] = ['plants', 'tasks', 'notes', 'poops', 'profiles', 'plays'];

export function createDemoBackend(): Backend {
  seed(new Date());
  const listeners = new Map<Table, Set<() => void>>();
  const emit = (t: Table) => listeners.get(t)?.forEach(cb => cb());

  window.addEventListener('storage', e => {
    const key = e.key?.slice(PREFIX.length) as Table | undefined;
    if (key && TABLE_KEYS.includes(key)) emit(key);
  });

  const delay = <T,>(v: T) => new Promise<T>(r => setTimeout(() => r(v), 60));

  return {
    mode: 'demo',
    userId: DEMO_ME.id,

    listProfiles: () => delay(get('profiles')),
    async updateMyName(name) {
      write('profiles', get('profiles').map(p => (p.id === DEMO_ME.id ? { ...p, name } : p)));
      emit('profiles');
    },

    listPlants: () => delay(get('plants')),
    async addDefaultPlants() {
      write('plants', DEFAULT_PLANTS.map(p => ({ ...p, moistureAt: new Date().toISOString() })));
      emit('plants');
    },
    async updatePlant(id, patch) {
      write('plants', get('plants').map(p => (p.id === id ? { ...p, ...patch } : p)));
      emit('plants');
    },

    listTasks: date => delay(get('tasks').filter(t => t.date === date)),
    async saveTask(task) {
      write('tasks', [...get('tasks').filter(t => t.id !== task.id), task]);
      emit('tasks');
    },

    listNotes: (limit = 50) => delay([...get('notes')].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)),
    async addNote(text, plantId) {
      const note: Note = { id: uid(), text, plantId, createdAt: new Date().toISOString(), userId: DEMO_ME.id };
      write('notes', [note, ...get('notes')]);
      emit('notes');
      return note;
    },

    listPoops: since => delay(get('poops').filter(p => p.createdAt >= since)),
    async addPoop(userId, grade) {
      const poop: Poop = { id: uid(), userId, grade, createdAt: new Date().toISOString() };
      write('poops', [...get('poops'), poop]);
      emit('poops');
      return poop;
    },
    async deletePoop(id) {
      write('poops', get('poops').filter(p => p.id !== id));
      emit('poops');
    },

    listPlays: since => {
      const on = new Set(get('profiles').filter(p => p.spotifyConnected).map(p => p.id));
      return delay(mockPlays(new Date()).filter(p => p.playedAt >= since && on.has(p.userId)));
    },
    spotifyConnectUrl: async () => {
      throw new Error('Spotify koppelen kan alleen met Supabase. Zie de README.');
    },
    async disconnectSpotify() {},

    subscribe(table, cb) {
      if (!listeners.has(table)) listeners.set(table, new Set());
      listeners.get(table)!.add(cb);
      return () => listeners.get(table)!.delete(cb);
    },

    async signOut() {},
  };
}

/** Zet de demo terug naar de voorbeelddata. */
export function resetDemo() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
  } catch {
    /* niets */
  }
  memory.clear();
}
