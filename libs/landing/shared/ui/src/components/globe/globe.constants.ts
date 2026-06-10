import type { COBEOptions } from 'cobe';
import type { LandingTheme } from '../../theme';
import type { GlobeCity } from './globe.types';

/** Fixed backing-buffer size — decouples cobe init from CSS layout timing.
 *  Browser scales the rendered canvas to fit its CSS width. */
export const BUFFER_SIZE = 800;

/** Initial phi aims the camera at ~120°E so HCMC / Singapore / Sydney are
 *  facing the viewer on first paint. */
export const BASE_PHI = 2.6;
export const BASE_THETA = 0.2;

export const MARKER_SIZE = 0.035;

export const CITIES: readonly GlobeCity[] = [
  { id: 'hcmc', label: 'Ho Chi Minh City', lat: 10.78, lng: 106.7 },
  { id: 'sgp', label: 'Singapore', lat: 1.35, lng: 103.82 },
  { id: 'syd', label: 'Australia', lat: -33.87, lng: 151.21 },
];

/** Projected sphere radius, as a % of the container's smaller side.
 *  Cobe's default `scale: 1` renders the sphere at ~85% of the canvas; half = ~42%. */
export const PROJECTED_RADIUS_PCT = 41;

/** Radians per frame at 60fps — slow enough to read city labels (~30s per
 *  rotation). */
export const AUTO_ROTATE_STEP = 0.0035;

/** After a drag ends, hold position this long before resuming auto-rotate. */
export const AUTO_ROTATE_RESUME_MS = 2000;

type GlobePalette = Pick<
  COBEOptions,
  'dark' | 'baseColor' | 'markerColor' | 'glowColor' | 'mapBrightness' | 'mapBaseBrightness' | 'diffuse' | 'opacity'
>;

export const PALETTES: Record<LandingTheme, GlobePalette> = {
  dark: {
    dark: 1,
    diffuse: 1.2,
    mapBrightness: 6,
    baseColor: [0.4, 0.45, 0.7],
    // landing-accent (dark) #6e66d9 → [0.43, 0.40, 0.85]
    markerColor: [0.43, 0.4, 0.85],
    glowColor: [0.4, 0.45, 0.7],
    opacity: 1,
  },
  light: {
    dark: 0,
    diffuse: 1.4,
    mapBrightness: 12,
    baseColor: [0.85, 0.88, 0.96],
    // landing-accent (light) #5b53c2 → [0.36, 0.33, 0.76]
    markerColor: [0.36, 0.33, 0.76],
    glowColor: [1, 1, 1],
    opacity: 0.85,
  },
};
