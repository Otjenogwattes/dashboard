import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ModuleMark } from '../../components/ModuleMark';
import { StatusPill, type PlantStatus } from '../../components/Pill';
import { TaskCheckbox } from '../../components/TaskCheckbox';
import type { PlantId, Task } from '../../data/types';
import './plants.css';

export interface PlantView {
  id: PlantId;
  name: string;
  place: string;
  moisture: number;
  status: PlantStatus;
  tasks: Task[];
}

type Props = {
  plants: PlantView[];
  onToggle: (task: Task) => void;
  onAddPlant?: () => void;
  compact?: boolean;
  loading?: boolean;
};

export function PlantsCard({ plants, onToggle, onAddPlant, compact, loading }: Props) {
  const all = plants.flatMap(p => p.tasks);
  const done = all.filter(t => t.done).length;
  const empty = !loading && plants.length === 0;

  return (
    <Card radius={compact ? 22 : 24} flat={compact} className={compact ? 'plants plants--m' : 'plants'} aria-label="Mijn planten">
      {!compact && (
        <div className="plants__head">
          <ModuleMark module="tuin" size={11} />
          <h2 className="plants__title">Mijn planten</h2>
          {!empty && all.length > 0 && (
            <span className="plants__count num">{done}/{all.length} gedaan</span>
          )}
        </div>
      )}

      {loading && <div className="plants__loading" aria-busy="true">Planten laden…</div>}

      {empty && (
        <div className="plants__empty">
          <span>
            {compact
              ? 'Nog geen planten toegevoegd.'
              : 'Nog geen planten. Voeg je tomaat en basilicum toe, dan plannen we water en vorstbescherming op basis van het weer.'}
          </span>
          <Button onClick={onAddPlant}>Plant toevoegen</Button>
        </div>
      )}

      {plants.map(p => (
        <div key={p.id} className="plant">
          <div className="plant__row">
            <span className="plant__photo stripes" aria-hidden="true">{compact ? '' : 'foto'}</span>
            <span className="plant__info">
              <span className="plant__name">{p.name}</span>
              <span className="plant__meta">
                {p.moisture}% vocht{compact ? '' : ` · ${p.place}`}
              </span>
            </span>
            <StatusPill status={p.status} size={compact ? 'sm' : 'md'} />
          </div>
          {p.tasks.map(t => (
            <TaskCheckbox key={t.id} title={t.title} detail={t.detail} done={t.done} compact={compact} onToggle={() => onToggle(t)} />
          ))}
        </div>
      ))}
    </Card>
  );
}
