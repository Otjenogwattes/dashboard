import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PLANTS } from '../features/plants/plantRules';
import type { Backend, Table } from './backend';
import type { Note, Plant, PlantId, Play, Poop, Profile, Task } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

let client: SupabaseClient | null = null;

/** null als Supabase niet is ingesteld: dan draait Balkon in demo-modus. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}

/* ---------- rijen uit de database naar app-types ---------- */

type Row = Record<string, unknown>;

const toProfile = (r: Row): Profile => ({ id: r.id as string, name: (r.name as string) ?? '', spotifyConnected: !!r.spotify_connected });
const toPlant = (r: Row): Plant => ({
  id: r.id as PlantId,
  name: r.name as string,
  place: r.place as string,
  moisturePct: r.moisture_pct as number,
  moistureAt: r.moisture_at as string,
});
const toTask = (r: Row): Task => ({
  id: r.id as string,
  plantId: r.plant_id as PlantId,
  kind: r.kind as Task['kind'],
  title: r.title as string,
  detail: r.detail as string,
  done: !!r.done,
  date: r.date as string,
  prevMoisturePct: r.prev_moisture_pct as number | null,
  prevMoistureAt: r.prev_moisture_at as string | null,
});
const toNote = (r: Row): Note => ({
  id: r.id as string,
  text: r.text as string,
  plantId: r.plant_id as PlantId,
  createdAt: r.created_at as string,
  userId: r.user_id as string,
});
const toPoop = (r: Row): Poop => ({ id: r.id as string, userId: r.user_id as string, createdAt: r.created_at as string, grade: r.grade as number | null });
const toPlay = (r: Row): Play => ({
  userId: r.user_id as string,
  playedAt: r.played_at as string,
  trackId: r.track_id as string,
  trackName: r.track_name as string,
  artistName: r.artist_name as string,
  imageUrl: r.image_url as string | null,
  durationMs: r.duration_ms as number,
});

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const TABLES: Table[] = ['profiles', 'plants', 'tasks', 'notes', 'poops', 'plays'];

const backends = new Map<string, Backend>();

/** Eén backend (en één realtime-kanaal) per ingelogde gebruiker. */
export function supabaseBackendFor(sb: SupabaseClient, userId: string): Backend {
  let b = backends.get(userId);
  if (!b) {
    b = createSupabaseBackend(sb, userId);
    backends.set(userId, b);
  }
  return b;
}

function createSupabaseBackend(sb: SupabaseClient, userId: string): Backend {
  const listeners = new Map<Table, Set<() => void>>();
  const timers = new Map<Table, ReturnType<typeof setTimeout>>();
  // Wijzigingen bundelen: 50 nieuwe nummers geven één herlaadactie.
  const emit = (t: Table) => {
    clearTimeout(timers.get(t));
    timers.set(t, setTimeout(() => listeners.get(t)?.forEach(cb => cb()), 250));
  };

  let channel = sb.channel(`balkon-${userId}`);
  for (const t of TABLES) channel = channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, () => emit(t));
  channel.subscribe(status => {
    // Na een verbroken verbinding alles verversen, voor het geval we iets misten.
    if (status === 'SUBSCRIBED') TABLES.forEach(emit);
  });

  return {
    mode: 'supabase',
    userId,

    async listProfiles() {
      return check(await sb.from('profiles').select('*').order('created_at')).map(toProfile);
    },
    async updateMyName(name) {
      check(await sb.from('profiles').update({ name }).eq('id', userId));
    },

    async listPlants() {
      return check(await sb.from('plants').select('*')).map(toPlant);
    },
    async addDefaultPlants() {
      const now = new Date().toISOString();
      check(
        await sb.from('plants').upsert(
          DEFAULT_PLANTS.map(p => ({ id: p.id, name: p.name, place: p.place, moisture_pct: p.moisturePct, moisture_at: now })),
          { onConflict: 'id', ignoreDuplicates: true },
        ),
      );
    },
    async updatePlant(id, patch) {
      const row: Row = {};
      if (patch.moisturePct != null) row.moisture_pct = patch.moisturePct;
      if (patch.moistureAt != null) row.moisture_at = patch.moistureAt;
      if (patch.place != null) row.place = patch.place;
      check(await sb.from('plants').update(row).eq('id', id));
    },

    async listTasks(date) {
      return check(await sb.from('tasks').select('*').eq('date', date)).map(toTask);
    },
    async saveTask(t) {
      check(
        await sb.from('tasks').upsert({
          id: t.id,
          plant_id: t.plantId,
          kind: t.kind,
          title: t.title,
          detail: t.detail,
          done: t.done,
          date: t.date,
          prev_moisture_pct: t.prevMoisturePct ?? null,
          prev_moisture_at: t.prevMoistureAt ?? null,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        }),
      );
    },

    async listNotes(limit = 50) {
      return check(await sb.from('notes').select('*').order('created_at', { ascending: false }).limit(limit)).map(toNote);
    },
    async addNote(text, plantId) {
      return toNote(check(await sb.from('notes').insert({ text, plant_id: plantId, user_id: userId }).select().single()));
    },

    async listPoops(since) {
      return check(await sb.from('poops').select('id,user_id,grade,created_at').gte('created_at', since).order('created_at')).map(toPoop);
    },
    async addPoop(forUser, grade) {
      return toPoop(check(await sb.from('poops').insert({ user_id: forUser, grade, logged_by: userId }).select().single()));
    },
    async deletePoop(id) {
      check(await sb.from('poops').delete().eq('id', id));
    },

    async listPlays(since) {
      // Supabase geeft maximaal 1000 rijen per verzoek; haal alles in blokken op.
      const out: Play[] = [];
      for (let from = 0; ; from += 1000) {
        const rows = check(
          await sb.from('plays').select('*').gte('played_at', since).order('played_at').range(from, from + 999),
        );
        out.push(...rows.map(toPlay));
        if (rows.length < 1000) return out;
      }
    },
    async spotifyConnectUrl() {
      const { data, error } = await sb.functions.invoke('spotify-auth', { body: { action: 'start', returnTo: window.location.origin } });
      if (error || !data?.url) throw new Error('Spotify koppelen lukte niet. Staan de Edge Functions en Spotify-sleutels goed? Zie de README.');
      return data.url as string;
    },
    async disconnectSpotify() {
      const { error } = await sb.functions.invoke('spotify-auth', { body: { action: 'disconnect' } });
      if (error) throw new Error('Ontkoppelen lukte niet.');
    },

    subscribe(table, cb) {
      if (!listeners.has(table)) listeners.set(table, new Set());
      listeners.get(table)!.add(cb);
      return () => listeners.get(table)!.delete(cb);
    },

    async signOut() {
      backends.delete(userId);
      await sb.removeChannel(channel);
      await sb.auth.signOut();
    },
  };
}
