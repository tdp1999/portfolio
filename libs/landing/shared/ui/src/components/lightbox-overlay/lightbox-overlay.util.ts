import { buildCloudinarySrcset } from '@portfolio/landing/shared/util';
import type { LightboxItem } from '../lightbox/lightbox.types';
import { FULL_WIDTH } from './lightbox-overlay.data';
import type { ResolvedSource } from './lightbox-overlay.types';

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Resolve the best display source: explicit full > Cloudinary upscale > inline. */
export function resolveBestSource(item: LightboxItem): ResolvedSource {
  if (item.fullSrc) {
    return { src: item.fullSrc, srcset: item.srcset ?? null, download: item.downloadUrl || item.fullSrc };
  }
  if (item.srcset) {
    return { src: item.url, srcset: item.srcset, download: item.downloadUrl || item.url };
  }
  const cl = buildCloudinarySrcset(item.url, FULL_WIDTH);
  if (cl.srcset) {
    return { src: cl.src, srcset: cl.srcset, download: item.downloadUrl || cl.src };
  }
  return { src: item.url, srcset: null, download: item.downloadUrl || item.url };
}
