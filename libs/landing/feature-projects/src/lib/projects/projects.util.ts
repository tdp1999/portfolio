import type { ViewMode } from './projects.types';
import { VIEW_MODES } from './projects.types';

export function parseCsvSet<T>(raw: string | null, parse: (s: string) => T | null): Set<T> {
  if (!raw) return new Set();
  const out = new Set<T>();
  for (const part of raw.split(',')) {
    const v = parse(part.trim());
    if (v !== null) out.add(v);
  }
  return out;
}

export function isViewMode(v: string | null): v is ViewMode {
  return v != null && (VIEW_MODES as readonly string[]).includes(v);
}

export function initialViewMode(raw: string | null): ViewMode {
  return isViewMode(raw) ? raw : 'row';
}

export function yearOf(iso: string): string {
  const y = new Date(iso).getFullYear();
  return Number.isFinite(y) ? String(y) : '';
}
