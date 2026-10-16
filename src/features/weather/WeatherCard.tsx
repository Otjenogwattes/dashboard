import { Card } from '../../components/Card';
import { ModuleMark } from '../../components/ModuleMark';
import { temp } from '../../lib/format';
import type { WeatherView } from './weather';
import './weather.css';

const HOUR_LABELS = [6, 9, 12, 15, 18, 21, 24, 27, 30];
const pct = (t: number) => ((t - 6) / 24) * 100;
const X = (t: number) => ((t - 6) / 24) * 1000;

function nowLabel(t: number) {
  const h = Math.floor(t) % 24;
  const m = Math.floor((t % 1) * 60);
  return `NU ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function WeatherCard({ view, compact, city }: { view: WeatherView; compact?: boolean; city: string }) {
  const { current } = view;

  if (compact) {
    return (
      <Card radius={22} flat className="weather weather--m" aria-label={`Weer in ${city}`}>
        <div className="weather-m__head">
          <span className="weather-m__temp">{temp(current.temp)}°</span>
          <span className="weather-m__sub">
            {view.short} · regen {Math.round(view.rainToday)}% · vannacht{' '}
            <span className={view.frost ? 'weather-m__frost' : undefined}>{temp(view.nightMin)}°</span>
          </span>
        </div>
        <ul className="weather-m__pins" aria-label="Wat trek je aan">
          {view.pins.map(p => (
            <li key={p.hour} className="weather-m__pin">
              <span className="weather__pin-time">{p.time}</span>
              <span className="weather-m__pin-text">
                <span className="weather__pin-title">{p.title}</span>
                <span className="weather__pin-sub">{p.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  const temps = view.line.map(h => h.temp);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const showZero = minT <= 4;
  const lo = (showZero ? Math.min(minT, 0) : minT) - 2;
  const hi = Math.max(maxT + 2, lo + 12);
  const Y = (v: number) => 140 - ((v - lo) / (hi - lo)) * 130;
  const zeroY = Y(0);
  const points = view.line.map(h => `${X(h.t).toFixed(1)},${Y(h.temp).toFixed(1)}`).join(' ');
  const rainMax = Math.max(50, ...view.rainBars);
  const nowLeft = view.nowT != null ? pct(view.nowT) : null;

  return (
    <Card radius={28} className="weather" aria-label={`Weer in ${city}`}>
      <div className="weather__head">
        <span className="weather__temp">{temp(current.temp)}°</span>
        <div className="weather__desc">
          <span className="weather__sum">{view.summary}</span>
          <span className="weather__sub">
            Voelt als {temp(current.feels)}° · regenkans {Math.round(view.rainToday)}% · wind {view.bft} Bft
          </span>
        </div>
        <span className="weather__label">
          <ModuleMark module="kleding" />
          WAT TREK JE AAN
        </span>
      </div>

      <ul className="weather__pins" aria-label="Wat trek je aan">
        {view.pins.map(p => (
          <li key={p.hour} className="weather__pin" style={{ left: `${pct(p.hour - 0.5)}%` }}>
            <span className="weather__pin-time">{p.time}</span>
            <span className="weather__pin-title">{p.title}</span>
            <span className="weather__pin-sub">{p.sub}</span>
          </li>
        ))}
      </ul>

      <div className="weather__chart">
        <svg width="100%" height="150" viewBox="0 0 1000 160" preserveAspectRatio="none" role="img" aria-label="Temperatuur van 06:00 vandaag tot 06:00 morgen">
          {showZero && (
            <>
              <rect x="0" y={zeroY} width="1000" height={Math.max(0, 160 - zeroY)} fill="var(--frost-soft)" />
              <line x1="0" x2="1000" y1={zeroY} y2={zeroY} stroke="var(--frost)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            </>
          )}
          {view.nowT != null && (
            <line x1={X(view.nowT)} x2={X(view.nowT)} y1="0" y2="160" stroke="var(--ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          )}
          <polyline points={points} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {nowLeft != null && view.nowT != null && (
          <span className={nowLeft > 85 ? 'weather__now weather__now--flip' : 'weather__now'} style={{ left: `${nowLeft}%` }}>
            {nowLabel(view.nowT)}
          </span>
        )}
        {view.frost && <span className="weather__frost">◆ VORST {temp(view.nightMin)}° · BASILICUM BINNEN</span>}
      </div>

      <div className="weather__rain" role="img" aria-label={`Regenkans per uur, hoogste ${Math.round(Math.max(...view.rainBars))}%`}>
        {view.rainBars.map((r, i) => (
          <span key={i} style={{ height: `${Math.round((r / rainMax) * 100)}%` }} />
        ))}
      </div>
      <div className="weather__hours" aria-hidden="true">
        {HOUR_LABELS.map((h, i) => (
          <span key={h} style={{ left: `${pct(h)}%`, transform: `translateX(${i === 0 ? '0' : i === HOUR_LABELS.length - 1 ? '-100%' : '-50%'})` }}>
            {String(h % 24).padStart(2, '0')}
          </span>
        ))}
      </div>
    </Card>
  );
}
