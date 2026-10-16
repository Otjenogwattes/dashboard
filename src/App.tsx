import { useState } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Logo } from './components/Logo';
import { ModuleMark } from './components/ModuleMark';
import { StatusPill } from './components/Pill';
import { TaskCheckbox } from './components/TaskCheckbox';

/** Tijdelijke componentenpagina (stap 1). */
export function App() {
  const [done, setDone] = useState(false);
  return (
    <main style={{ padding: 32, display: 'grid', gap: 20, maxWidth: 560 }}>
      <Logo />
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusPill status="ok" />
          <StatusPill status="droog" />
          <StatusPill status="actie" />
        </div>
        <TaskCheckbox title="Water geven" detail="ca. 1 liter" done={done} onToggle={() => setDone(!done)} />
      </Card>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ModuleMark module="tuin" /> <ModuleMark module="muziek" /> <ModuleMark module="kleding" /> <ModuleMark module="shit" />
        <Button>Opslaan</Button>
        <Button variant="music">Spotify koppelen</Button>
      </div>
    </main>
  );
}
