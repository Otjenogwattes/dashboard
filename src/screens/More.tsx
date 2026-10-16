import type { ReactNode } from 'react';
import { Card } from '../components/Card';
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
      </div>
    </div>
  );
}
