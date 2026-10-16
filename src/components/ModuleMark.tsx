import type { CSSProperties } from 'react';

/** tuin = vierkantje, muziek = rondje, kleding/shit = aarde. */
export type Module = 'tuin' | 'muziek' | 'kleding' | 'shit' | 'meer';

const DEFAULT_SIZE: Record<Module, [number, number]> = {
  tuin: [10, 10],
  muziek: [10, 10],
  kleding: [16, 8],
  shit: [12, 12],
  meer: [11, 11],
};

export function ModuleMark({ module, size, style }: { module: Module; size?: number; style?: CSSProperties }) {
  const [w, h] = size ? [size, size] : DEFAULT_SIZE[module];
  return <span className={`mark mark--${module}`} style={{ width: w, height: h, ...style }} aria-hidden="true" />;
}
