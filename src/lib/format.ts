/** Getal met komma als decimaalteken: 7.5 → "7,5". */
export function nl(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',');
}

/** Temperatuur zonder eenheid, met echte min-teken: −1 */
export function temp(n: number): string {
  const r = Math.round(n);
  return r < 0 ? `−${Math.abs(r)}` : String(r === 0 ? 0 : r);
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
