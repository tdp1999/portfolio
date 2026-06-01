import { BreakpointConfig } from './breakpoint.type';

/**
 * The four device-bound breakpoints. See
 * `.context/design/responsive-contract.md` §1.
 */
export type Bp = 'mobile' | 'tablet' | 'laptop' | 'wide';

/**
 * Non-overlapping, full-coverage query bands for the 4-BP responsive API.
 * Thresholds MUST mirror the SCSS `$breakpoints` map and Tailwind `screens`
 * (48 / 64 / 90 rem). A 0.02rem epsilon keeps adjacent bands from both
 * matching at the threshold pixel.
 */
export const RESPONSIVE_BREAKPOINTS: BreakpointConfig = {
  mobile: '(max-width: 47.98rem)',
  tablet: '(min-width: 48rem) and (max-width: 63.98rem)',
  laptop: '(min-width: 64rem) and (max-width: 89.98rem)',
  wide: '(min-width: 90rem)',
} as const;

/** Rank 0–3 — backs `isAtLeast(bp)`. */
export const BP_ORDER: Record<Bp, number> = {
  mobile: 0,
  tablet: 1,
  laptop: 2,
  wide: 3,
} as const;

/**
 * SSR fallback: with no viewport on the server, the widest BP is assumed so the
 * server emits the desktop layout; the client swaps on hydration. See §12.
 */
export const SSR_FALLBACK_BP: Bp = 'wide';
