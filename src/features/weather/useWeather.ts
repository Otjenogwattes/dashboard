import { useMemo } from 'react';
import { mockWeather } from '../../data/mock';
import { hoursSinceMidnight } from '../../lib/dates';
import { buildWeatherView, type WeatherView } from './weather';

/** Stap 2: nog met de voorbeelddata uit het ontwerp. */
export function useWeather(now: Date): { view: WeatherView | null; error: string | null; loading: boolean } {
  const view = useMemo(() => {
    const { hours, current } = mockWeather();
    return buildWeatherView(hours, current, hoursSinceMidnight(now));
  }, [now]);
  return { view, error: null, loading: false };
}
