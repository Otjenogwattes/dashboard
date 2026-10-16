import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ModuleMark } from '../../components/ModuleMark';
import type { DuetStats, TopTrack } from './musicStats';
import './music.css';

type Props = {
  stats: DuetStats | null;
  herName: string;
  /** Is de partner gekoppeld aan Spotify? */
  herOn: boolean;
  /** Kan de huidige gebruiker nog Spotify koppelen? */
  canConnect: boolean;
  range: string;
  onConnect: () => void;
  onInvite: () => void;
  compact?: boolean;
  loading?: boolean;
  error?: string | null;
};

function Cover({ track }: { track: TopTrack }) {
  if (track.imageUrl) return <img className="duet__cover" src={track.imageUrl} alt="" width={52} height={52} loading="lazy" />;
  return <span className="duet__cover duet__cover--empty" aria-hidden="true">hoes</span>;
}

export function MusicDuet({ stats, herName, herOn, canConnect, range, onConnect, onInvite, compact, loading, error }: Props) {
  const hasData = !!stats && stats.mePlays > 0;
  const herUpper = herName.toUpperCase();

  const emptyText = canConnect
    ? `Koppel jouw Spotify en die van ${herName}. Na een paar dagen verschijnt hier jullie eerste week.`
    : 'Na een paar dagen verschijnt hier jullie eerste week.';

  if (compact) {
    return (
      <Card tone="night" radius={22} className="duet duet--m" aria-label="Muziek deze week">
        {loading && <span className="duet__muted">Muziek laden…</span>}
        {!loading && error && <span className="duet__muted" role="alert">{error}</span>}
        {!loading && !error && hasData && stats && (
          <>
            <div className="duet-m__top">
              <span className="duet-m__person">
                <span className="duet-m__who" style={{ color: 'var(--music)' }}>JIJ</span>
                <span className="duet-m__hours">{stats.meHours} u</span>
              </span>
              {herOn ? (
                <>
                  <span className="duet-m__samen">{stats.samenPct}% samen</span>
                  <span className="duet-m__person duet-m__person--right">
                    <span className="duet-m__who" style={{ color: 'var(--music-2)' }}>{herUpper}</span>
                    <span className="duet-m__hours">{stats.herHours} u</span>
                  </span>
                </>
              ) : (
                <Button variant="dashed" onClick={onInvite} style={{ minHeight: 40 }}>+ {herName} koppelen</Button>
              )}
            </div>
            <div className="duet-m__rows">
              {stats.artists.map(a => {
                const her = herOn ? a.her : 0;
                return (
                  <div key={a.name} className="duet-m__row">
                    <div className="duet__side duet__side--me">
                      <span className="duet__bar duet__bar--me" style={{ width: `${Math.round((a.me / stats.max) * 100)}%` }} />
                    </div>
                    <span className="duet-m__name" style={{ fontWeight: a.me && her ? 700 : 500 }}>{a.name}</span>
                    <div className="duet__side" style={{ opacity: herOn ? 1 : 0 }}>
                      <span className="duet__bar duet__bar--her" style={{ width: `${Math.round((her / stats.max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {herOn && stats.samen && (
              <span className="duet__muted">
                Samen grijsgedraaid: <span className="duet-m__strong">{stats.samen.title}</span> · {stats.samen.artist}
              </span>
            )}
          </>
        )}
        {!loading && !error && !hasData && (
          <>
            <span className="duet-m__empty-title">Nog stil op Balkon.</span>
            <span className="duet__muted">Koppel jullie Spotify-accounts.</span>
            {canConnect && <Button variant="music" onClick={onConnect} style={{ alignSelf: 'flex-start' }}>Spotify koppelen</Button>}
          </>
        )}
      </Card>
    );
  }

  const tracks = stats
    ? [
        { who: 'JIJ', color: 'var(--music)', t: stats.me },
        ...(herOn ? [{ who: 'SAMEN', color: 'var(--night-ink)', t: stats.samen }, { who: herUpper, color: 'var(--music-2)', t: stats.her }] : []),
      ].filter((x): x is { who: string; color: string; t: TopTrack } => !!x.t)
    : [];

  return (
    <Card tone="night" radius={28} className="duet" aria-label="Muziek deze week">
      <div className="duet__head">
        <ModuleMark module="muziek" size={12} />
        <h2 className="duet__title">Wat er deze week thuis speelde</h2>
        <span className="duet__range">{range}</span>
      </div>

      {loading && <span className="duet__muted">Muziek laden…</span>}
      {!loading && error && <span className="duet__muted" role="alert">{error}</span>}

      {!loading && !error && hasData && stats && (
        <>
          <div className="duet__top">
            <div className="duet__person">
              <span className="duet__badge duet__badge--me">JIJ</span>
              <span className="duet__hours-wrap">
                <span className="duet__hours">{stats.meHours} <span>uur</span></span>
                <span className="duet__src">Spotify · jij</span>
              </span>
            </div>
            <div className="duet__samen">
              {herOn && (
                <>
                  <span className="duet__samen-pct">{stats.samenPct}%</span>
                  <span className="duet__samen-label">samen gedraaid</span>
                </>
              )}
            </div>
            {herOn ? (
              <div className="duet__person duet__person--her">
                <span className="duet__hours-wrap">
                  <span className="duet__hours">{stats.herHours} <span>uur</span></span>
                  <span className="duet__src">Spotify · {herName}</span>
                </span>
                <span className="duet__badge duet__badge--her">{herName.charAt(0).toUpperCase()}</span>
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="duet__rows-wrap">
            <div className="duet__rows" role="table" aria-label={`Top-artiesten: jij links, ${herName} rechts`}>
              {stats.artists.map(a => {
                const her = herOn ? a.her : 0;
                return (
                  <div key={a.name} className="duet__row" role="row">
                    <div className="duet__side duet__side--me" role="cell">
                      <span className="duet__count">{a.me ? `${a.me}×` : ''}</span>
                      <span className="duet__bar duet__bar--me" style={{ width: `${Math.round((a.me / stats.max) * 100)}%` }} />
                    </div>
                    <span className="duet__name" role="rowheader" style={{ fontWeight: a.me && her ? 700 : 500 }}>{a.name}</span>
                    <div className="duet__side" role="cell" style={{ opacity: herOn ? 1 : 0 }}>
                      <span className="duet__bar duet__bar--her" style={{ width: `${Math.round((her / stats.max) * 100)}%` }} />
                      <span className="duet__count">{her ? `${her}×` : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {!herOn && (
              <div className="duet__invite">
                <span className="duet__invite-title">Ook {herName} op Balkon?</span>
                <span className="duet__invite-text">Koppel haar Spotify, dan zie je hier wat jullie allebei draaien. Zij keurt het goed in de Spotify-app.</span>
                <Button variant="music-2" onClick={onInvite}>Uitnodiging sturen</Button>
              </div>
            )}
          </div>

          <div className="duet__tracks">
            {tracks.map(x => (
              <div key={x.who} className="duet__track">
                <Cover track={x.t} />
                <span className="duet__track-text">
                  <span className="duet__track-who" style={{ color: x.color }}>{x.who}</span>
                  <span className="duet__track-title">{x.t.title}</span>
                  <span className="duet__track-artist">{x.t.artist} · {x.t.plays}×</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && !hasData && (
        <div className="duet__empty">
          <span className="duet__empty-title">Het is nog stil op Balkon.</span>
          <span className="duet__empty-text">{emptyText}</span>
          {canConnect && <Button variant="music" size="lg" onClick={onConnect}>Spotify koppelen</Button>}
        </div>
      )}
    </Card>
  );
}
