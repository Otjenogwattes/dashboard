import type { HTMLAttributes, ReactNode } from 'react';

export type PlantStatus = 'ok' | 'droog' | 'actie';

export const STATUS_LABEL: Record<PlantStatus, string> = {
  ok: 'OK',
  droog: 'Bijna droog',
  actie: 'Actie nodig',
};

type PillProps = HTMLAttributes<HTMLSpanElement> & { size?: 'md' | 'sm'; children: ReactNode };

export function Pill({ size = 'md', className, children, ...rest }: PillProps) {
  const cls = ['pill', size === 'sm' && 'pill--sm', className].filter(Boolean).join(' ');
  return <span className={cls} {...rest}>{children}</span>;
}

/** Status altijd als vorm + tekst, nooit alleen kleur. */
export function StatusPill({ status, size = 'md' }: { status: PlantStatus; size?: 'md' | 'sm' }) {
  return (
    <Pill size={size} className={`status--${status}`}>
      <span className={`status-shape status-shape--${status}`} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </Pill>
  );
}
