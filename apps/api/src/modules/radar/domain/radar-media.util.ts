import { isPlainObject } from '@portfolio/shared/utils';

import { RadarMedia, RadarSharedPost } from './radar.types';

/** Facebook photo ids survive re-scrapes; CDN URLs do not, so the URL is only a fallback key. */
export const mediaKey = (m: Pick<RadarMedia, 'externalId' | 'url'>) => m.externalId ?? m.url;

const isStored = (m: unknown): m is RadarMedia =>
  isPlainObject(m) &&
  m['storageStatus'] === 'stored' &&
  typeof m['storedUrl'] === 'string' &&
  typeof m['storedExternalId'] === 'string';

export interface CarryOverResult<T> {
  value: T;
  /** Storage ids of stored images that no longer match anything; the caller deletes the files. */
  orphaned: string[];
}

/**
 * On re-capture, keeps the stored copy of every image the item already had, so it is not
 * uploaded again. The fresh original URL still replaces the old one. Images that failed before
 * come back as `pending`: a re-capture brings a newly signed URL, which is the natural retry.
 * Stored images the new capture no longer contains are reported as orphaned.
 */
export function carryOverStoredMedia(previous: unknown, incoming: RadarMedia[]): CarryOverResult<RadarMedia[]> {
  const stored = new Map(
    (Array.isArray(previous) ? previous : []).filter(isStored).map((m) => [mediaKey(m), m] as const)
  );

  const value = incoming.map((m): RadarMedia => {
    const hit = stored.get(mediaKey(m));
    if (!hit) return m;
    stored.delete(mediaKey(m));
    return {
      ...m,
      storedUrl: hit.storedUrl,
      storedExternalId: hit.storedExternalId,
      storageStatus: 'stored',
      storageError: null,
    };
  });

  return { value, orphaned: [...stored.values()].map((m) => m.storedExternalId as string) };
}

export function carryOverSharedPostMedia(
  previous: unknown,
  incoming: RadarSharedPost | null
): CarryOverResult<RadarSharedPost | null> {
  const previousMedia = isPlainObject(previous) ? previous['media'] : undefined;
  const { value: media, orphaned } = carryOverStoredMedia(previousMedia, incoming?.media ?? []);
  return { value: incoming ? { ...incoming, media } : null, orphaned };
}

export type ImageResult =
  | { key: string; outcome: 'stored'; storedUrl: string; storedExternalId: string }
  | { key: string; outcome: 'failed'; error: string };

/**
 * Applies upload results to the item's current media, image by image. Only entries that are
 * still `pending` under the same key take a result, so a re-capture that landed during the
 * upload is never overwritten. Stored results that found no entry are returned as orphans.
 */
export function applyImageResults(
  media: RadarMedia[],
  sharedMedia: RadarMedia[],
  results: ImageResult[]
): { media: RadarMedia[]; sharedMedia: RadarMedia[]; orphaned: string[] } {
  const remaining = new Map(results.map((r) => [r.key, r]));

  const apply = (list: RadarMedia[]) =>
    list.map((m): RadarMedia => {
      const result = m.storageStatus === 'pending' ? remaining.get(mediaKey(m)) : undefined;
      if (!result) return m;
      remaining.delete(result.key);
      return result.outcome === 'stored'
        ? {
            ...m,
            storedUrl: result.storedUrl,
            storedExternalId: result.storedExternalId,
            storageStatus: 'stored',
            storageError: null,
          }
        : { ...m, storageStatus: 'failed', storageError: result.error };
    });

  const nextMedia = apply(media);
  const nextShared = apply(sharedMedia);
  const orphaned = [...remaining.values()].flatMap((r) => (r.outcome === 'stored' ? [r.storedExternalId] : []));
  return { media: nextMedia, sharedMedia: nextShared, orphaned };
}

/** The URL a reader should load: our stored copy once it exists, else the (short-lived) original. */
export const servedUrl = (m: RadarMedia) => (m.storageStatus === 'stored' && m.storedUrl ? m.storedUrl : m.url);
