import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Section } from '../components/Section';
import { useBackend } from '../data/context';
import { resetDemo } from '../data/demoBackend';
import { useProfiles } from '../data/useProfiles';
import { useMusic } from '../features/music/useMusic';
import { PlacePicker } from '../features/weather/PlacePicker';
import type { Accent, ThemeApi, ThemeChoice } from '../lib/theme';
import { SpotifyStatus } from './MusicScreen';
import './more.css';

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

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'Systeem' },
  { id: 'light', label: 'Licht' },
  { id: 'dark', label: 'Donker' },
];
const ACCENTS: { id: Accent; label: string }[] = [
  { id: 'koraal', label: 'Koraal' },
  { id: 'geel', label: 'Geel' },
];

function Appearance({ theme }: { theme: ThemeApi }) {
  return (
    <Section title="Weergave">
      <div className="setting-col">
        <span className="setting-hint" id="thema-label">Licht of donker. Systeem volgt je telefoon of computer.</span>
        <div className="segmented" role="group" aria-labelledby="thema-label">
          {THEMES.map(t => (
            <button key={t.id} type="button" aria-pressed={theme.choice === t.id} onClick={() => theme.setChoice(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>
      <div className="setting-col">
        <span className="setting-hint" id="accent-label">Accent: welke kleur is van jou en welke van de ander.</span>
        <div className="segmented" role="group" aria-labelledby="accent-label">
          {ACCENTS.map(a => (
            <button key={a.id} type="button" aria-pressed={theme.accent === a.id} onClick={() => theme.setAccent(a.id)}>
              <span className="swatch" style={{ background: a.id === 'koraal' ? '#EE6A4C' : '#F0A030' }} aria-hidden="true" />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function More({ now, compact, theme }: { now: Date; compact: boolean; theme: ThemeApi }) {
  const { me, partner, partnerName } = useProfiles();
  const music = useMusic(now, me, partner);
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
        <Appearance theme={theme} />
        <Account />
        <SpotifyStatus music={music} partnerName={partnerName} />
      </div>
    </div>
  );
}
