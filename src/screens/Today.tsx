import type { CSSProperties } from 'react';
import { DateHero } from '../components/DateHero';
import { MusicDuet } from '../features/music/MusicDuet';
import { useMusic } from '../features/music/useMusic';
import { NoteBar } from '../features/notes/NoteBar';
import { PlantsCard } from '../features/plants/PlantsCard';
import { heroLine } from '../features/plants/plantRules';
import { usePlants } from '../features/plants/usePlants';
import { ShitCounter } from '../features/shit/ShitCounter';
import { useShit } from '../features/shit/useShit';
import { WeatherCard } from '../features/weather/WeatherCard';
import type { WeatherView } from '../features/weather/weather';
import { useBackend } from '../data/context';
import { useProfiles } from '../data/useProfiles';
import { greeting } from '../lib/dates';
import { invitePartner } from '../lib/invite';
import './today.css';

type Props = {
  now: Date;
  city: string;
  weather: { view: WeatherView | null; error: string | null; loading: boolean };
  compact: boolean;
};

export function Today({ now, city, weather, compact }: Props) {
  const backend = useBackend();
  const { me, partner, partnerName } = useProfiles();
  const facts = weather.view ? { frost: weather.view.frost, nightMin: weather.view.nightMin, maxToday: weather.view.maxToday } : null;
  const plants = usePlants(now, facts);
  const shit = useShit(now, me, partner);
  const music = useMusic(now, me, partner);

  const hero = `${greeting(now)} ${heroLine(facts, plants.loading ? null : plants.plants.flatMap(p => p.tasks))}`;
  const weatherCard = weather.view ? (
    <WeatherCard view={weather.view} compact={compact} city={city} />
  ) : (
    <WeatherPlaceholder compact={compact} loading={weather.loading} error={weather.error} />
  );

  const plantsCard = (
    <PlantsCard plants={plants.plants} onToggle={plants.toggle} onAddPlant={plants.addDefaults} compact={compact} loading={plants.loading && !plants.plants.length} />
  );

  const shitCard = (
    <ShitCounter
      me={shit.me}
      her={shit.her}
      herName={partnerName}
      todayIdx={shit.todayIdx}
      pending={shit.pending}
      onInc={shit.inc}
      onDec={shit.dec}
      onGrade={shit.grade}
      compact={compact}
      error={shit.error}
    />
  );

  const duet = (
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
    />
  );

  if (compact) {
    return (
      <>
        <DateHero date={now} compact />
        <p className="greeting greeting--m">{hero}</p>
        {weatherCard}
        {plantsCard}
        {shitCard}
        {duet}
      </>
    );
  }

  return (
    <div className="today">
      <div className="today__top">
        <div className="today__left">
          <DateHero date={now} />
          <p className="greeting">{hero}</p>
          {plantsCard}
        </div>
        <div className="today__right">
          {weatherCard}
          {shitCard}
        </div>
      </div>
      {duet}
      <NoteBar onSave={(text, plantId) => backend.addNote(text, plantId)} />
    </div>
  );
}

function WeatherPlaceholder({ compact, loading, error }: { compact: boolean; loading: boolean; error: string | null }) {
  return (
    <div className={compact ? 'card card--flat weather-ph weather-ph--m' : 'card weather-ph'} style={{ '--card-r': compact ? '22px' : '28px' } as CSSProperties} aria-busy={loading}>
      {error ? (
        <span role="alert">{error}</span>
      ) : (
        <span>Weer ophalen…</span>
      )}
    </div>
  );
}
