import { useEffect, useState } from 'react';
import { searchPlaces, type Place } from './openMeteo';
import { setPlace, usePlace } from './usePlace';

export function PlacePicker() {
  const place = usePlace();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setStatus(null);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      searchPlaces(q, ctrl.signal)
        .then(r => {
          setResults(r);
          setStatus(r.length ? null : 'Geen plaats gevonden.');
        })
        .catch(e => {
          if ((e as Error).name !== 'AbortError') setStatus('Zoeken lukte niet.');
        });
    }, 250);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [query]);

  return (
    <div className="setting-col">
      <p className="setting-hint">
        Nu: <strong>{place.name}</strong>
        {place.region ? ` (${place.region})` : ''}
      </p>
      <input
        className="field"
        type="search"
        aria-label="Zoek een plaats"
        placeholder="Zoek een plaats, bijv. Amersfoort"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {status && <p className="setting-hint" role="status">{status}</p>}
      {results.length > 0 && (
        <ul className="place-results">
          {results.map(r => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                type="button"
                className="place-result"
                onClick={() => {
                  setPlace(r);
                  setQuery('');
                  setResults([]);
                  setStatus(`Weer staat nu op ${r.name}.`);
                }}
              >
                <span className="place-result__name">{r.name}</span>
                <span className="place-result__region">{r.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
