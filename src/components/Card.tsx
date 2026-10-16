import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div';
  radius?: 22 | 24 | 28;
  tone?: 'surface' | 'night';
  flat?: boolean;
  children: ReactNode;
};

export function Card({ as: Tag = 'article', radius = 24, tone = 'surface', flat, className, style, children, ...rest }: Props) {
  const cls = ['card', tone === 'night' && 'card--night', flat && 'card--flat', className].filter(Boolean).join(' ');
  return (
    <Tag className={cls} style={{ '--card-r': `${radius}px`, ...style } as CSSProperties} {...rest}>
      {children}
    </Tag>
  );
}
