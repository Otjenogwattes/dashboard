import { Card } from '../../components/Card';
import { ModuleMark } from '../../components/ModuleMark';
import { WEEK_LETTERS } from '../../lib/dates';
import { leadText, type PersonShit } from './shitStats';
import './shit.css';

export type Who = 'me' | 'her';

type Props = {
  me: PersonShit;
  her: PersonShit;
  herName: string;
  todayIdx: number;
  pending: Who | null;
  onInc: (who: Who) => void;
  onDec: (who: Who) => void;
  onGrade: (grade: number | null) => void;
  compact?: boolean;
  error?: string | null;
};

export function ShitCounter({ me, her, herName, todayIdx, pending, onInc, onDec, onGrade, compact, error }: Props) {
  const smax = Math.max(3, ...me.week, ...her.week);
  const weekLine = `${me.weekTotal} – ${her.weekTotal}`;
  const people = [
    { key: 'me' as const, who: 'JIJ', name: 'jou', s: me, ink: 'var(--music-ink)', btn: 'var(--music)' },
    { key: 'her' as const, who: herName.toUpperCase(), name: herName, s: her, ink: 'var(--music-2-ink)', btn: 'var(--music-2)' },
  ];

  const picker = pending && (
    <div className="grade" role="group" aria-label="Cijfer geven">
      <span className="grade__q">Cijfer voor {pending === 'her' ? herName : 'jou'}?</span>
      {Array.from({ length: 10 }, (_, i) => (
        <button key={i} type="button" className="grade__n" aria-label={`Cijfer ${i + 1}`} onClick={() => onGrade(i + 1)}>
          {i + 1}
        </button>
      ))}
      <button type="button" className="grade__skip" onClick={() => onGrade(null)}>overslaan</button>
    </div>
  );

  if (compact) {
    return (
      <Card radius={22} flat className="shit shit--m" aria-label="Shit counter">
        <div className="shit-m__head">
          <span className="shit__label">SHIT COUNTER</span>
          <span className="shit-m__week num">week {weekLine}</span>
        </div>
        <div className="shit-m__tiles">
          {people.map(p => (
            <div key={p.key} className="shit-m__tile">
              <span className="shit-m__info">
                <span className="shit-m__who" style={{ color: p.ink }}>{p.who}</span>
                <span className="shit-m__today num" aria-live="polite">{p.s.today}</span>
                <span className="shit-m__avg">gem. {p.s.avg}</span>
              </span>
              <span className="shit__btns">
                <button type="button" className="shit__inc shit__inc--m" style={{ background: p.btn }} aria-label={`Eén erbij voor ${p.who === 'JIJ' ? 'jou' : p.name}`} onClick={() => onInc(p.key)}>+1</button>
                <button type="button" className="shit__dec" aria-label={`Eén eraf voor ${p.who === 'JIJ' ? 'jou' : p.name}`} disabled={p.s.today === 0} onClick={() => onDec(p.key)}>oeps</button>
              </span>
            </div>
          ))}
        </div>
        {picker}
        {error && <p className="shit__error" role="alert">{error}</p>}
      </Card>
    );
  }

  return (
    <Card radius={28} className="shit" aria-label="Shit counter">
      <div className="shit__intro">
        <span className="shit__label">
          <ModuleMark module="shit" />
          SHIT COUNTER
        </span>
        <span className="shit__lead">{leadText(me.weekTotal, her.weekTotal, herName)}</span>
        <span className="shit__week num">Week: {weekLine}</span>
      </div>
      {people.map(p => (
        <div key={p.key} className="shit__tile">
          <div className="shit__info">
            <span className="shit__who" style={{ color: p.ink }}>{p.who}</span>
            <span className="shit__today num" aria-live="polite">{p.s.today}</span>
            <span className="shit__avg">
              vandaag · gem. <span>{p.s.avg}</span>
            </span>
          </div>
          <div className="shit__chart" role="img" aria-label={`${p.who === 'JIJ' ? 'Jij' : p.name} deze week: ${p.s.weekTotal} keer`}>
            {p.s.week.map((n, i) => (
              <span key={i} className="shit__day">
                <span
                  className="shit__bar"
                  style={{
                    height: `${i > todayIdx ? 0 : Math.round((n / smax) * 100)}%`,
                    background: i === todayIdx ? p.btn : i > todayIdx ? 'var(--line)' : 'var(--ink-2)',
                  }}
                />
                <span className="shit__letter" style={{ color: i === todayIdx ? 'var(--ink)' : 'var(--ink-2)' }}>{WEEK_LETTERS[i]}</span>
              </span>
            ))}
          </div>
          <div className="shit__btns">
            <button type="button" className="shit__inc" style={{ background: p.btn }} aria-label={`Eén erbij voor ${p.who === 'JIJ' ? 'jou' : p.name}`} onClick={() => onInc(p.key)}>+1</button>
            <button type="button" className="shit__dec" aria-label={`Eén eraf voor ${p.who === 'JIJ' ? 'jou' : p.name}`} disabled={p.s.today === 0} onClick={() => onDec(p.key)}>oeps</button>
          </div>
        </div>
      ))}
      {picker}
      {error && <p className="shit__error" role="alert">{error}</p>}
    </Card>
  );
}
