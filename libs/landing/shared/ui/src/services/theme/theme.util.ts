import { STORAGE_KEY } from './theme.data';
import type { LandingTheme } from './theme.types';

export function readInitialTheme(document: Document, isBrowser: boolean): LandingTheme {
  if (!isBrowser) return 'dark';
  const fromAttr = document.documentElement.getAttribute('data-theme');
  if (fromAttr === 'light' || fromAttr === 'dark') return fromAttr;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}
