import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useBackend } from '../data/context';
import { resetDemo } from '../data/demoBackend';
import { useProfiles } from '../data/useProfiles';
import { PlacePicker } from '../features/weather/PlacePicker';
import './more.css';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card radius={24} className="setting">
      <h2 className="setting__title">{title}</h2>
      {children}
    </Card>
  );
}

function Account() {
  const backend = useBackend();
  const { me, partner } = useProfiles();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (me) setName(me.name);
  }, [me?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const n = name.trim();
    if (!n) return;
    try {
      await backend.updateMyName(n);
      setStatus('Naam opgeslagen.');
    } catch {
      setStatus('Opslaan lukte niet.');
    }
  }

  if (backend.mode === 'demo') {
    return (
      <Section title="Demo-modus">
        <p className="setting-hint">
          Balkon draait nu zonder Supabase, met de voorbeelddata uit het ontwerp. Alles blijft in deze browser. Zet de Supabase-sleutels in <code>.env</code> om
          samen met {partner?.name ?? 'Nikki'} te delen (zie de README).
        </p>
        <div className="setting-row">
          <Button variant="outline" onClick={() => { resetDemo(); window.location.reload(); }}>Voorbeelddata terugzetten</Button>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Jouw account">
      <label className="setting-col">
        <span className="setting-hint">Je naam, zoals {partner?.name ?? 'de ander'} hem ziet</span>
        <span className="setting-row">
          <input className="field" style={{ flex: 1, minWidth: 0 }} value={name} onChange={e => { setName(e.target.value); setStatus(null); }} onKeyDown={e => e.key === 'Enter' && save()} maxLength={40} />
          <Button onClick={save} disabled={!name.trim() || name.trim() === me?.name}>Opslaan</Button>
        </span>
      </label>
      {status && <p className="setting-hint" role="status">{status}</p>}
      <p className="setting-hint">
        Samen met: <strong>{partner?.name ?? 'nog niemand'}</strong>
      </p>
      <div className="setting-row">
        <Button variant="outline" onClick={() => backend.signOut()}>Uitloggen</Button>
      </div>
    </Section>
  );
}

export function More({ compact }: { compact: boolean }) {
  return (
    <div className={compact ? 'more more--m' : 'more'}>
      <header className="more__head">
        <h1 className={compact ? 'screen-title screen-title--m' : 'screen-title'}>{compact ? 'Meer' : 'Herinneringen'}</h1>
        <p className="screen-lead">Herinneringen volgen later. Hier stel je Balkon in.</p>
      </header>
      <div className="more__grid">
        <Section title="Plaats voor het weer">
          <PlacePicker />
        </Section>
        <Account />
      </div>
    </div>
  );
}
