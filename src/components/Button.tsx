import type { ButtonHTMLAttributes } from 'react';

type Variant = 'plant' | 'music' | 'music-2' | 'ink' | 'outline' | 'ghost' | 'dashed';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'md' | 'lg';
  wide?: boolean;
};

export function Button({ variant = 'plant', size = 'md', wide, className, type = 'button', ...rest }: Props) {
  const cls = ['btn', `btn--${variant}`, size === 'lg' && 'btn--lg', wide && 'btn--wide', className].filter(Boolean).join(' ');
  return <button type={type} className={cls} {...rest} />;
}
