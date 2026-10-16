import { useMemo, useState } from 'react';
import { useBackend, useLive } from '../../data/context';
import type { Profile } from '../../data/types';
import { addDays, rangeLabel, startOfDay } from '../../lib/dates';
import { computeDuet } from './musicStats';

/** Muziek van de afgelopen 7 dagen (vandaag meegerekend). */
export function useMusic(now: Date, me: Profile | null, her: Profile | null, artistLimit = 5) {
  const backend = useBackend();
  const from = addDays(startOfDay(now), -6);
  const since = from.toISOString();
  const plays = useLive(['plays'], b => b.listPlays(since), since);
  const herOn = !!her?.spotifyConnected;
  const [actionError, setActionError] = useState<string | null>(null);

  const stats = useMemo(
    () => (plays.data && me ? computeDuet(plays.data, me.id, herOn ? her!.id : null, artistLimit) : null),
    [plays.data, me, her, herOn, artistLimit],
  );

  async function connect() {
    setActionError(null);
    try {
      window.location.href = await backend.spotifyConnectUrl();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Spotify koppelen lukte niet.');
    }
  }

  async function disconnect() {
    setActionError(null);
    try {
      await backend.disconnectSpotify();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Ontkoppelen lukte niet.');
    }
  }

  return {
    stats,
    herOn,
    meOn: !!me?.spotifyConnected,
    range: rangeLabel(from, now),
    loading: plays.loading,
    error: plays.error,
    actionError,
    connect,
    disconnect,
  };
}
