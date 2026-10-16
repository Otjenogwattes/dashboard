import { ymd } from '../../lib/dates';
import type { CurrentWeather, HourPoint } from './weather';

/*
 * Open-Meteo: gratis, geen sleutel nodig. https://open-meteo.com/en/docs
 * Tijden komen terug in de tijdzone van de plek (timezone=auto).
 */

export interface Place {
  name: string;
  lat: number;
  lon: number;
  region?: string;
}

export const UTRECHT: Place = { name: 'Utrecht', lat: 52.0907, lon: 5.1214, region: 'Utrecht, NL' };

export interface Forecast {
  hours: HourPoint[];
  current: CurrentWeather;
  /** Datum (YYYY-MM-DD) waar t = 0 bij hoort. */
  day: string;
  fetchedAt: string;
}

interface ApiResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: (number | null)[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
}

export async function fetchForecast(place: Place, now: Date, signal?: AbortSignal): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: place.lat.toFixed(4),
    longitude: place.lon.toFixed(4),
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code',
    current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code,is_day',
    timezone: 'auto',
    forecast_days: '3',
    wind_speed_unit: 'kmh',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = (await res.json()) as ApiResponse;

  const day = ymd(now);
  const base = new Date(`${day}T00:00:00`).getTime();
  const h = data.hourly;
  const hours: HourPoint[] = h.time
    .map((time, i) => ({
      t: Math.round((new Date(time).getTime() - base) / 3600000),
      temp: h.temperature_2m[i],
      feels: h.apparent_temperature[i],
      rain: h.precipitation_probability[i] ?? 0,
      wind: h.wind_speed_10m[i],
      code: h.weather_code[i],
    }))
    .filter(p => p.t >= 0 && p.t <= 36);

  return {
    hours,
    day,
    fetchedAt: new Date().toISOString(),
    current: {
      temp: data.current.temperature_2m,
      feels: data.current.apparent_temperature,
      wind: data.current.wind_speed_10m,
      code: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
  };
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country_code?: string;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const params = new URLSearchParams({ name: query, count: '6', language: 'nl', format: 'json' });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal });
  if (!res.ok) throw new Error(`Geocoding ${res.status}`);
  const data = (await res.json()) as { results?: GeoResult[] };
  return (data.results ?? []).map(r => ({
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    region: [r.admin1, r.country_code].filter(Boolean).join(', '),
  }));
}
