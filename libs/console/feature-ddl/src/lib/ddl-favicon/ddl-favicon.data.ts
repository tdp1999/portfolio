/**
 * Console favicon — the record behind the shipped icon.
 *
 * Nothing here is a candidate any more: the page renders `/brand/favicon.svg`,
 * the file console actually ships. What the data below carries is the *reason*
 * that file is shaped the way it is, so the next person does not re-derive it.
 */

/** An ink that was weighed for the transparent mark, and how it scored. */
export interface InkOption {
  readonly label: string;
  readonly swatch: string;
  /** WCAG contrast against each tab strip. */
  readonly onLight: number;
  readonly onDark: number;
  readonly verdict: string;
}

/**
 * The two backgrounds a transparent favicon actually lands on: Chrome's light
 * and dark tab strips. Any fixed ink has to clear both, and only one does.
 */
export const TAB_STRIP = { light: '#dee1e6', dark: '#202124' } as const;

/** The shipped assets — same paths as `apps/console/src/index.html`. */
export const SHIPPED = {
  svg: '/brand/favicon.svg',
  ico: '/brand/favicon.ico',
} as const;

/** True favicon pixel sizes to preview at. */
export const FAVICON_SIZES = [16, 32, 64] as const;

/** Geometry facts behind the "why is it bigger than landing" note. */
export const FIT = {
  /** Landing's boxed mark keeps a clearspace margin. */
  boxed: 0.88,
  /** Transparent has no box edge to keep clear of. */
  ghost: 0.98,
  /** Monogram width ÷ height once Stage-1 padding is trimmed off. */
  aspect: 1.84,
} as const;

/**
 * Every fixed ink weighed for the transparent mark. Only the accent clears both
 * strips, which is why the `.ico` fallback is accent monotone and why the
 * primary asset had to become theme-adaptive instead of picking one of these.
 */
export const INK_OPTIONS: readonly InkOption[] = [
  {
    label: 'Chữ sáng #e7e9ee',
    swatch: '#e7e9ee',
    onLight: 1.08,
    onDark: 13.25,
    verdict: 'Biến mất trên thanh tab sáng.',
  },
  {
    label: 'Chữ đen #0a0d12',
    swatch: '#0a0d12',
    onLight: 14.84,
    onDark: 1.21,
    verdict: 'Biến mất trên thanh tab tối.',
  },
  {
    label: 'Tím accent #6E66D9',
    swatch: '#6E66D9',
    onLight: 3.51,
    onDark: 3.5,
    verdict: 'Cân bằng cả hai nhưng hơi nhạt, chưa đạt ngưỡng 4.5. Dùng làm bản .ico dự phòng.',
  },
  {
    label: 'Tím đậm #3B348C',
    swatch: '#3B348C',
    onLight: 7.79,
    onDark: 1.58,
    verdict: 'Biến mất trên thanh tab tối, nên không tách lớp được với Dot.',
  },
];
