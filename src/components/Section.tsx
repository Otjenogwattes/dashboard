import type { ReactNode } from 'react';
import { Card } from './Card';

/** Instellingenkaart met kop. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card radius={24} className="setting">
      <h2 className="setting__title">{title}</h2>
      {children}
    </Card>
  );
}
