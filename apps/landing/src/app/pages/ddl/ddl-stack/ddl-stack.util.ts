/**
 * DDL-ONLY: Iconify CDN URL builder. Production will not use this — `Skill.iconUrl`
 * comes from Cloudinary via the existing MediaPicker pipeline (single Media-driven
 * source of truth, matches `Skill.iconId` schema). CDN here is a prototype shortcut
 * so the page renders real-looking brand chips without seeding Cloudinary yet.
 */
const ICONIFY = 'https://api.iconify.design';

export const buildIconUrl = (slug: string, color?: string): string =>
  color ? `${ICONIFY}/${slug}.svg?color=${encodeURIComponent('#' + color)}` : `${ICONIFY}/${slug}.svg`;
