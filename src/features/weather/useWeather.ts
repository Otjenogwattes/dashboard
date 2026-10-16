import { useEffect, useMemo, useState } from 'react';
import { hoursSinceMidnight, ymd } from '../../lib/dates';
import { fetchForecast, type Forecast, type Place } from './openMeteo';
import { buildWeatherView, type WeatherView } from './weather';

const CACHE_KEY = 'balkon.forecast';
const REFRESH_MS = 30 * 60 * 1000;

type Cached = Forecast & { placeKey: string };
const placeKey = (p: Place) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;

function readCache(p: Place, day: string): Forecast | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as Cached | null;
    return c && c.placeKey === placeKey(p) && c.day === day ? c : null;
  } catch {
    return null;
  }
}

function writeCache(p: Place, f: Forecast) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...f, placeKey: placeKey(p) }));
  } catch {
    /* niet erg */
  }
}

/** Uurverwachting van Open-Meteo, elk half uur ververst. Laatste versie blijft bewaard voor offline. */
export function useWeather(now: Date, place: Place): { view: WeatherView | null; error: string | null; loading: boolean } {
  const day = ymd(now);
  const [forecast, setForecast] = useState<Forecast | null>(() => readCache(place, day));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!forecast);
  const pk = placeKey(place);

  useEffect(() => {
    const cached = readCache(place, day);
    setForecast(cached);
    setLoading(!cached);
    let ctrl = new AbortController();

    const load = () => {
      ctrl.abort();
      ctrl = new AbortController();
      fetchForecast(place, new Date(), ctrl.signal)
        .then(f => {
          setForecast(f);
          setError(null);
          writeCache(place, f);
        })
        .catch((e: unknown) => {
          if ((e as Error).name === 'AbortError') return;
          console.error(e);
          setError('Het weer kon niet worden opgehaald. We proberen het zo opnieuw.');
        })
        .finally(() => setLoading(false));
    };

    load();
    const id = setInterval(load, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const c = readCache(place, ymd(new Date()));
      if (!c || Date.now() - new Date(c.fetchedAt).getTime() > REFRESH_MS / 2) load();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', load);
    return () => {
      ctrl.abort();
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', load);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pk, day]);

  const view = useMemo(() => {
    if (!forecast || forecast.day !== day) return null;
    if (!forecast.hours.some(h => h.t === 6) || !forecast.hours.some(h => h.t === 30)) return null;
    return buildWeatherView(forecast.hours, forecast.current, hoursSinceMidnight(now));
  }, [forecast, now, day]);

  return { view, error: view ? null : error, loading: loading && !view };
}
