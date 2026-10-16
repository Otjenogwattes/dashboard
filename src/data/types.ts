export type PlantId = 'tomaat' | 'basilicum';

export interface Plant {
  id: PlantId;
  name: string;
  place: string;
  /** Laatst bekende vochtigheid (handmatig gezet of na water geven). */
  moisturePct: number;
  /** Moment waarop moisturePct gold; vanaf hier droogt de plant uit. */
  moistureAt: string;
}

export type TaskKind = 'water' | 'binnen' | 'oogst';

export interface Task {
  id: string;
  plantId: PlantId;
  kind: TaskKind;
  title: string;
  detail: string;
  done: boolean;
  /** YYYY-MM-DD */
  date: string;
  /** Vochtigheid vóór het water geven, om afvinken ongedaan te kunnen maken. */
  prevMoisturePct?: number | null;
  prevMoistureAt?: string | null;
}

export interface Note {
  id: string;
  text: string;
  plantId: PlantId;
  createdAt: string;
  userId: string;
}

export interface Poop {
  id: string;
  userId: string;
  createdAt: string;
  grade: number | null;
}

export interface Profile {
  id: string;
  name: string;
  spotifyConnected: boolean;
}

export interface Play {
  userId: string;
  playedAt: string;
  trackId: string;
  trackName: string;
  artistName: string;
  imageUrl: string | null;
  durationMs: number;
}
