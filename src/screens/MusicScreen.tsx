import { Button } from '../components/Button';
import { Section } from '../components/Section';
import { useBackend } from '../data/context';
import { useProfiles } from '../data/useProfiles';
import { MusicDuet } from '../features/music/MusicDuet';
import { useMusic } from '../features/music/useMusic';
import { invitePartner } from '../lib/invite';
import './more.css';

export function SpotifyStatus({ music, partnerName }: { music: ReturnType<typeof useMusic>; partnerName: string }) {
  const backend = useBackend();
  return (
    <Section title="Spotify">
      <p className="setting-hint">
        Jij: <strong>{music.meOn ? 'gekoppeld' : 'niet gekoppeld'}</strong> · {partnerName}: <strong>{music.herOn ? 'gekoppeld' : 'niet gekoppeld'}</strong>
      </p>
      <p className="setting-hint">
        Balkon leest alleen wat je recent draaide en je toplijsten. Elk uur komen de nieuwe nummers erbij, zodat we weektotalen kunnen maken.
      </p>
      {backend.mode === 'demo' && <p className="setting-hint">In demo-modus zie je voorbeeldmuziek. Koppelen kan zodra Supabase is ingesteld.</p>}
      <div className="setting-row">
        {music.meOn ? (
          <Button variant="outline" onClick={music.disconnect} disabled={backend.mode === 'demo'}>Mijn Spotify ontkoppelen</Button>
        ) : (
          <Button variant="music" onClick={music.connect}>Spotify koppelen</Button>
        )}
        {!music.herOn && <Button variant="outline" onClick={() => invitePartner(partnerName)}>{partnerName} uitnodigen</Button>}
      </div>
      {music.actionError && <p className="setting-hint" role="alert" style={{ color: 'var(--alert)' }}>{music.actionError}</p>}
    </Section>
  );
}

export function MusicScreen({ now, compact }: { now: Date; compact: boolean }) {
  const { me, partner, partnerName } = useProfiles();
  const music = useMusic(now, me, partner, 10);

  return (
    <div className={compact ? 'more more--m' : 'more'}>
      <header className="more__head">
        <h1 className={compact ? 'screen-title screen-title--m' : 'screen-title'}>Muziek</h1>
        <p className="screen-lead">De afgelopen zeven dagen. Jouw artiesten lopen naar links, die van {partnerName} naar rechts. Vetgedrukt draaien jullie allebei.</p>
      </header>
      <MusicDuet
        stats={music.stats}
        herName={partnerName}
        herOn={music.herOn}
        canConnect={!music.meOn}
        range={music.range}
        onConnect={music.connect}
        onInvite={() => invitePartner(partnerName)}
        compact={compact}
        loading={music.loading && !music.stats}
        error={music.error}
        notice={music.actionError}
      />
      <div className="more__grid">
        <SpotifyStatus music={music} partnerName={partnerName} />
      </div>
    </div>
  );
}
