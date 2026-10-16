import type { Note, Plant, PlantId, Play, Poop, Profile, Task } from './types';

export type Table = 'plants' | 'tasks' | 'notes' | 'poops' | 'profiles' | 'plays';

/**
 * Alles wat de app aan data nodig heeft. Twee implementaties:
 * demo (localStorage, voorbeelddata) en Supabase (gedeeld, realtime).
 */
export interface Backend {
  mode: 'demo' | 'supabase';
  /** id van de ingelogde gebruiker */
  userId: string;

  listProfiles(): Promise<Profile[]>;
  updateMyName(name: string): Promise<void>;

  listPlants(): Promise<Plant[]>;
  addDefaultPlants(): Promise<void>;
  updatePlant(id: PlantId, patch: Partial<Pick<Plant, 'moisturePct' | 'moistureAt' | 'place'>>): Promise<void>;

  listTasks(date: string): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;

  listNotes(limit?: number): Promise<Note[]>;
  addNote(text: string, plantId: PlantId): Promise<Note>;

  listPoops(sinceIso: string): Promise<Poop[]>;
  addPoop(userId: string, grade: number | null): Promise<Poop>;
  deletePoop(id: string): Promise<void>;

  listPlays(sinceIso: string): Promise<Play[]>;
  /** URL om naar Spotify te gaan en toestemming te geven. */
  spotifyConnectUrl(): Promise<string>;
  disconnectSpotify(): Promise<void>;

  /** Roept `cb` aan als er iets in de tabel verandert (ook door de ander). */
  subscribe(table: Table, cb: () => void): () => void;

  signOut(): Promise<void>;
}
