import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Backend, Table } from './backend';

const BackendContext = createContext<Backend | null>(null);

export function BackendProvider({ backend, children }: { backend: Backend; children: ReactNode }) {
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>;
}

export function useBackend(): Backend {
  const b = useContext(BackendContext);
  if (!b) throw new Error('useBackend buiten BackendProvider');
  return b;
}

export interface Live<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  /** Lokaal bijwerken (optimistisch), tot de volgende reload. */
  set: (fn: (prev: T | null) => T | null) => void;
}

/**
 * Laadt data en laadt opnieuw zodra de tabel verandert (realtime),
 * als het tabblad weer zichtbaar wordt, of als `key` wijzigt.
 */
export function useLive<T>(tables: Table[], load: (b: Backend) => Promise<T>, key = ''): Live<T> {
  const backend = useBackend();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;
  const seq = useRef(0);

  const reload = useCallback(() => {
    const n = ++seq.current;
    loadRef.current(backend)
      .then(d => {
        if (n !== seq.current) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (n !== seq.current) return;
        console.error(e);
        setError('Kon de gegevens niet laden.');
      })
      .finally(() => {
        if (n === seq.current) setLoading(false);
      });
  }, [backend]);

  const tableKey = tables.join(',');
  useEffect(() => {
    reload();
    const offs = tableKey.split(',').map(t => backend.subscribe(t as Table, reload));
    const onVisible = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      offs.forEach(off => off());
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [backend, reload, tableKey, key]);

  return { data, error, loading, reload, set: fn => setData(prev => fn(prev)) };
}
