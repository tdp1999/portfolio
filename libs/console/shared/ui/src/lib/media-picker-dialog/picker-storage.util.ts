import { STORAGE_KEYS } from '@portfolio/console/shared/util';
import type { AssetGridViewMode } from '../asset-grid/asset-grid.types';

const RECENT_KEY = STORAGE_KEYS.mediaPickerRecent;
const VIEW_MODE_KEY = STORAGE_KEYS.mediaPickerViewMode;
const MAX_RECENT = 5;

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  const storage = safeStorage();
  if (!storage) return null;
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readRecentIds(): string[] {
  const parsed = readJson<unknown>(RECENT_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_RECENT);
}

export function pushRecentIds(ids: readonly string[]): void {
  const storage = safeStorage();
  if (!storage || ids.length === 0) return;
  const existing = readRecentIds();
  const merged = [...ids, ...existing.filter((id) => !ids.includes(id))].slice(0, MAX_RECENT);
  try {
    storage.setItem(RECENT_KEY, JSON.stringify(merged));
  } catch {
    // quota or serialization — silently drop
  }
}

export function writeRecentIds(ids: string[]): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
  } catch {
    // ignore
  }
}

export function readViewMode(): AssetGridViewMode {
  const parsed = readJson<unknown>(VIEW_MODE_KEY);
  return parsed === 'list' ? 'list' : 'grid';
}

export function writeViewMode(mode: AssetGridViewMode): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(VIEW_MODE_KEY, JSON.stringify(mode));
  } catch {
    // ignore
  }
}
