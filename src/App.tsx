import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BackendProvider, useBackend } from './data/context';
import { createDemoBackend } from './data/demoBackend';
import { getSupabase, supabaseBackendFor } from './data/supabaseBackend';
import { NoteBar } from './features/notes/NoteBar';
import { usePlace } from './features/weather/usePlace';
import { useWeather } from './features/weather/useWeather';
import { useIsDesktop } from './lib/useMediaQuery';
import { useNow } from './lib/useNow';
import { useTheme } from './lib/theme';
import { Login, NewPassword, Splash, useSession } from './screens/Login';
import { More } from './screens/More';
import { PlantsScreen } from './screens/PlantsScreen';
import { Today } from './screens/Today';
import { DesktopShell, MobileShell, type Tab } from './shell/Shell';

const TAB_IDS: Tab[] = ['vandaag', 'planten', 'muziek', 'meer'];

function useHashTab(): [Tab, (t: Tab) => void] {
  const read = () => {
    const h = window.location.hash.slice(1) as Tab;
    return TAB_IDS.includes(h) ? h : 'vandaag';
  };
  const [tab, setTab] = useState<Tab>(read);
  useEffect(() => {
    const on = () => setTab(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [tab, t => { window.location.hash = t === 'vandaag' ? '' : t; setTab(t); }];
}

export function App() {
  const sb = getSupabase();
  return sb ? <WithSupabase sb={sb} /> : <Demo />;
}

/** Zonder Supabase-sleutels: voorbeelddata in deze browser. */
function Demo() {
  const backend = useMemo(() => createDemoBackend(), []);
  return (
    <BackendProvider backend={backend}>
      <Balkon />
    </BackendProvider>
  );
}

function WithSupabase({ sb }: { sb: SupabaseClient }) {
  const { session, loading, recovery, doneRecovering } = useSession(sb);
  const userId = session?.user.id;
  const backend = useMemo(() => (userId ? supabaseBackendFor(sb, userId) : null), [sb, userId]);
  if (loading) return <Splash />;
  if (recovery && session) return <NewPassword sb={sb} onDone={doneRecovering} />;
  if (!backend) return <Login sb={sb} />;
  return (
    <BackendProvider backend={backend}>
      <Balkon />
    </BackendProvider>
  );
}

function Balkon() {
  const backend = useBackend();
  const isDesktop = useIsDesktop();
  const theme = useTheme();
  const [tab, setTab] = useHashTab();
  const now = useNow();
  const place = usePlace();
  const city = place.name;
  const weather = useWeather(now, place);

  const screen =
    tab === 'vandaag' ? (
      <Today now={now} city={city} weather={weather} compact={!isDesktop} />
    ) : tab === 'planten' ? (
      <PlantsScreen now={now} weather={weather} compact={!isDesktop} />
    ) : tab === 'meer' ? (
      <More compact={!isDesktop} />
    ) : (
      <Later tab={tab} compact={!isDesktop} />
    );

  if (isDesktop) {
    return (
      <DesktopShell tab={tab} onTab={setTab} city={city} theme={theme}>
        {screen}
      </DesktopShell>
    );
  }
  return (
    <MobileShell
      tab={tab}
      onTab={setTab}
      city={city}
      theme={theme}
      bottom={tab === 'vandaag' || tab === 'planten' ? <NoteBar compact onSave={(text, plantId) => backend.addNote(text, plantId)} /> : null}
    >
      {screen}
    </MobileShell>
  );
}

function Later({ tab, compact }: { tab: Tab; compact: boolean }) {
  const title = { vandaag: 'Vandaag', planten: 'Planten', muziek: 'Muziek', meer: 'Herinneringen' }[tab];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h1 className={compact ? 'screen-title screen-title--m' : 'screen-title'}>{title}</h1>
      <p className="screen-lead">Dit scherm volgt later in dezelfde stijl.</p>
    </section>
  );
}
