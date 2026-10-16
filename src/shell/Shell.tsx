import type { ReactNode } from 'react';
import { Logo } from '../components/Logo';
import { ModuleMark, type Module } from '../components/ModuleMark';
import type { ThemeApi } from '../lib/theme';
import './shell.css';

export type Tab = 'vandaag' | 'planten' | 'muziek' | 'meer';

const TABS: { id: Tab; desktop: string; mobile: string; mark: Module | null }[] = [
  { id: 'vandaag', desktop: 'Vandaag', mobile: 'Vandaag', mark: null },
  { id: 'planten', desktop: 'Planten', mobile: 'Planten', mark: 'tuin' },
  { id: 'muziek', desktop: 'Muziek', mobile: 'Muziek', mark: 'muziek' },
  { id: 'meer', desktop: 'Herinneringen', mobile: 'Meer', mark: 'meer' },
];

type Props = {
  tab: Tab;
  onTab: (t: Tab) => void;
  city: string;
  theme: ThemeApi;
  children: ReactNode;
};

export function DesktopShell({ tab, onTab, city, theme, children }: Props) {
  const themeLabel = theme.resolved === 'dark' ? 'DONKER' : 'LICHT';
  return (
    <div className="shell-d">
      <header className="topbar">
        <Logo />
        <nav aria-label="Hoofdmenu">
          <ul className="topnav">
            {TABS.map(t => (
              <li key={t.id}>
                <button type="button" className="topnav__item" aria-current={tab === t.id ? 'page' : undefined} onClick={() => onTab(t.id)}>
                  {t.mark && t.mark !== 'meer' && <ModuleMark module={t.mark} />}
                  {t.desktop}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className="topbar__place"
          onClick={theme.toggle}
          aria-label={`${city}. Thema: ${theme.resolved === 'dark' ? 'donker' : 'licht'}. Klik om te wisselen.`}
        >
          {city.toUpperCase()} · {themeLabel}
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function MobileShell({ tab, onTab, city, children, bottom }: Props & { bottom?: ReactNode }) {
  return (
    <div className="shell-m">
      <main className="shell-m__scroll">
        <div className="shell-m__top">
          <Logo compact />
          <span className="shell-m__place">{city.toUpperCase()}</span>
        </div>
        {children}
      </main>
      {bottom}
      <nav aria-label="Hoofdmenu">
        <ul className="tabbar">
          {TABS.map(t => (
            <li key={t.id}>
              <button type="button" className="tabbar__item" aria-current={tab === t.id ? 'page' : undefined} onClick={() => onTab(t.id)}>
                {tab === t.id ? <span className="tabbar__active" aria-hidden="true" /> : t.mark ? <ModuleMark module={t.mark} size={11} /> : <span className="tabbar__active" style={{ background: 'var(--ink-2)' }} aria-hidden="true" />}
                {t.mobile}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
