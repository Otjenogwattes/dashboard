import { useEffect, useState, type KeyboardEvent } from 'react';
import { Button } from '../../components/Button';
import { ModuleMark } from '../../components/ModuleMark';
import type { Note, PlantId } from '../../data/types';
import { hhmm } from '../../lib/dates';
import './notes.css';

const TARGETS: { id: PlantId; name: string }[] = [
  { id: 'tomaat', name: 'Tomaat' },
  { id: 'basilicum', name: 'Basilicum' },
];

/** Op mobiel is er geen plantkeuze: haal hem uit de tekst. */
function guessPlant(text: string, fallback: PlantId): PlantId {
  const t = text.toLowerCase();
  const basil = t.includes('basilicum');
  const tomato = t.includes('tomaat') || t.includes('tomaten');
  if (basil && !tomato) return 'basilicum';
  if (tomato && !basil) return 'tomaat';
  return fallback;
}

type Props = {
  onSave: (text: string, plantId: PlantId) => Promise<Note>;
  compact?: boolean;
};

export function NoteBar({ onSave, compact }: Props) {
  const [draft, setDraft] = useState('');
  const [target, setTarget] = useState<PlantId>('tomaat');
  const [saved, setSaved] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Op mobiel verdwijnt de bevestiging na een paar seconden.
  useEffect(() => {
    if (!compact || !saved) return;
    const id = setTimeout(() => setSaved(null), 5000);
    return () => clearTimeout(id);
  }, [compact, saved]);

  async function save() {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const note = await onSave(text, compact ? guessPlant(text, target) : target);
      setDraft('');
      setSaved(note);
    } catch {
      setError('Opslaan lukte niet. Probeer het nog eens.');
    } finally {
      setBusy(false);
    }
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') save();
  };

  const status = error ? (
    <span role="alert" className="notebar__status notebar__status--error">{error}</span>
  ) : saved ? (
    <span role="status" className="notebar__status">
      Opgeslagen bij {saved.plantId} om {hhmm(new Date(saved.createdAt))}: “{saved.text}”
    </span>
  ) : (
    <span role="status" className="sr-only" />
  );

  if (compact) {
    return (
      <div className="notebar-m">
        {(saved || error) && status}
        <div className="notebar-m__row">
          <input
            aria-label="Tuinnotitie"
            className="notebar-m__input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="Tuinnotitie…"
            enterKeyHint="done"
          />
          <button type="button" className="notebar-m__add" aria-label="Notitie opslaan" onClick={save} disabled={busy}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div className="notes">
      <div className="notebar">
        <span className="notebar__label">
          <ModuleMark module="tuin" />
          TUINNOTITIE
        </span>
        <input
          aria-label="Tuinnotitie"
          className="notebar__input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Bijv. eerste bladluis op de basilicum"
        />
        <span className="notebar__targets">
          {TARGETS.map(t => (
            <button key={t.id} type="button" className="notebar__target" aria-pressed={target === t.id} onClick={() => setTarget(t.id)}>
              {t.name}
            </button>
          ))}
        </span>
        <Button size="lg" wide onClick={save} disabled={busy}>Opslaan</Button>
      </div>
      {status}
    </div>
  );
}
