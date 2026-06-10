import type { RGB } from './ddl-contrast.types';

export function parseRgb(value: string): RGB | null {
  const m = value.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const nums = m[1].replace(/\//g, ' ').replace(/,/g, ' ').trim().split(/\s+/).map(Number);
  if (nums.length < 3 || nums.some((n) => Number.isNaN(n))) return null;
  return { r: nums[0], g: nums[1], b: nums[2] };
}

export function toHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export function relLuminance({ r, g, b }: RGB): number {
  const lin = (c: number): number => {
    const cs = c / 255;
    return cs <= 0.04045 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function wcagRatio(fg: RGB, bg: RGB): number {
  const l1 = relLuminance(fg);
  const l2 = relLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function sRGBtoY({ r, g, b }: RGB): number {
  const e = (c: number): number => (c / 255) ** 2.4;
  return 0.2126729 * e(r) + 0.7151522 * e(g) + 0.072175 * e(b);
}

/** APCA-W3 (frozen constants 2021-02-15). Returns signed Lc on a ±106 scale. */
export function apcaLc(txt: RGB, bg: RGB): number {
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const clamp = (y: number): number => (y > blkThrs ? y : y + (blkThrs - y) ** blkClmp);
  const yTxt = clamp(sRGBtoY(txt));
  const yBg = clamp(sRGBtoY(bg));
  if (Math.abs(yBg - yTxt) < 0.0005) return 0;
  let sapc: number;
  let out: number;
  if (yBg > yTxt) {
    sapc = (yBg ** 0.56 - yTxt ** 0.57) * 1.14;
    out = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    sapc = (yBg ** 0.65 - yTxt ** 0.62) * 1.14;
    out = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return out * 100;
}
