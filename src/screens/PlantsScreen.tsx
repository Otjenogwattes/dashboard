import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatusPill } from '../components/Pill';
import { TaskCheckbox } from '../components/TaskCheckbox';
import { useBackend, useLive } from '../data/context';
import type { Note } from '../data/types';
import { useProfiles } from '../data/useProfiles';
import { NoteBar } from '../features/notes/NoteBar';
import type { PlantView } from '../features/plants/PlantsCard';
import { usePlants } from '../features/plants/usePlants';
import type { WeatherView } from '../features/weather/weather';
import { hhmm, ymd } from '../lib/dates';
import './plants-screen.css';

function when(iso: string, now: Date): string {
  const d = new Date(iso);
  const day = ymd(d) === ymd(now) ? 'vandaag' : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  return `${day} ${hhmm(d)}`;
}

function MoistureEditor({ plant, onSave }: { plant: PlantView; onSave: (pct: number) => Promise<void> }) {
  const [value, setValue] = useState(plant.moisture);
  const [saved, setSaved] = useState(false);
  const changed = value !== plant.moisture;
  return (
    <div className="moist-edit">
      <label className="moist-edit__label" htmlFor={`moist-${plant.id}`}>
        Klopt het niet? Zet het vocht op <strong className="num">{value}%</strong>
      </label>
      <div className="moist-edit__row">
        <input
          id={`moist-${plant.id}`}
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={e => {
            setValue(Number(e.target.value));
            setSaved(false);
          }}
        />
        <Button variant="outline" disabled={!changed} onClick={async () => { await onSave(value); setSaved(true); }}>
          Opslaan
        </Button>
      </div>
      {saved && <span className="moist-edit__ok" role="status">Bijgewerkt.</span>}
    </div>
  );
}

type Props = {
  now: Date;
  weather: { view: WeatherView | null };
  compact: boolean;
};

export function PlantsScreen({ now, weather, compact }: Props) {
  const backend = useBackend();
  const { me, partnerName } = useProfiles();
  const facts = weather.view ? { frost: weather.view.frost, nightMin: weather.view.nightMin, maxToday: weather.view.maxToday } : null;
  const plants = usePlants(now, facts);
  const notes = useLive<Note[]>(['notes'], b => b.listNotes(100));
  const author = (n: Note) => (n.userId === me?.id ? 'jij' : partnerName);

  return (
    <div className={compact ? 'pscreen pscreen--m' : 'pscreen'}>
      <header className="pscreen__head">
        <h1 className={compact ? 'screen-title screen-title--m' : 'screen-title'}>Planten</h1>
        <p className="screen-lead">
          Vocht is een schatting: na water geven staat hij op 90% en daarna droogt de pot elke dag wat uit, sneller als het warm is.
        </p>
      </header>

      {plants.loading && !plants.plants.length && <p className="screen-lead" aria-busy="true">Planten laden…</p>}
      {plants.error && <p className="screen-lead" role="alert">{plants.error}</p>}
      {!plants.loading && !plants.plants.length && !plants.error && (
        <Card className="pcard pcard--empty">
          <p className="setting-hint">Nog geen planten. Voeg je tomaat en basilicum toe, dan plannen we water en vorstbescherming op basis van het weer.</p>
          <Button onClick={plants.addDefaults}>Plant toevoegen</Button>
        </Card>
      )}

      <div className="pscreen__grid">
        {plants.plants.map(p => {
          const own = (notes.data ?? []).filter(n => n.plantId === p.id);
          return (
            <Card key={p.id} radius={compact ? 22 : 24} className="pcard" aria-label={p.name}>
              <div className="pcard__head">
                <span className="pcard__photo stripes" aria-hidden="true">foto</span>
                <span className="pcard__info">
                  <span className="pcard__name">{p.name}</span>
                  <span className="pcard__place">{p.place}</span>
                </span>
                <StatusPill status={p.status} />
              </div>

              <div className="pcard__moist">
                <span className="pcard__pct num">{p.moisture}%</span>
                <span className="pcard__pct-label">vocht, geschat</span>
                <span className="pcard__meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.moisture} aria-label={`Vocht ${p.name}`}>
                  <span style={{ width: `${p.moisture}%` }} />
                </span>
              </div>
              <MoistureEditor key={p.moisture} plant={p} onSave={pct => plants.setMoisture(p.id, pct)} />

              <section className="pcard__section" aria-label={`Taken voor ${p.name}`}>
                <h2 className="pcard__sub">Vandaag</h2>
                {p.tasks.length ? (
                  p.tasks.map(t => <TaskCheckbox key={t.id} title={t.title} detail={t.detail} done={t.done} onToggle={() => plants.toggle(t)} />)
                ) : (
                  <p className="setting-hint">Niets te doen vandaag.</p>
                )}
              </section>

              <section className="pcard__section" aria-label={`Tuinnotities ${p.name}`}>
                <h2 className="pcard__sub">Tuinnotities</h2>
                {notes.loading && !notes.data && <p className="setting-hint">Laden…</p>}
                {notes.data && !own.length && <p className="setting-hint">Nog geen notities voor de {p.name.toLowerCase()}.</p>}
                <ul className="pnotes">
                  {own.slice(0, 8).map(n => (
                    <li key={n.id} className="pnote">
                      <span className="pnote__text">{n.text}</span>
                      <span className="pnote__meta">{when(n.createdAt, now)} · {author(n)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Card>
          );
        })}
      </div>

      {!compact && <NoteBar onSave={(text, plantId) => backend.addNote(text, plantId)} />}
    </div>
  );
}
