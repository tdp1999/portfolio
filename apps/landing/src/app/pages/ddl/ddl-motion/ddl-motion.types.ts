/**
 * Shipped-motion catalogue types. A `MotionEffect` documents ONE real animation
 * or transition that ships on the landing surface — not a wishlist idea (see
 * `/ddl/interactions` for those). Each captured effect carries a looping clip at
 * `/motion/<id>.{webm,mp4}` + `<id>.poster.png`; `hasClip=false` means the entry
 * is documented but its clip has not been captured yet.
 */
export interface MotionEffect {
  /** kebab id — also the clip basename and the anchor within its group. */
  readonly id: string;
  readonly name: string;
  /** One-line mechanism (what CSS/JS actually does). */
  readonly mechanism: string;
  /** Source anchor, e.g. `components/mega-menu/mega-menu.scss:334`. */
  readonly file: string;
  /** Which surface uses it. */
  readonly scope: string;
  /** `@keyframes` name, when the effect is keyframe-driven. */
  readonly keyframe?: string;
  /** Whether it is gated behind the `reduce-motion` mixin. */
  readonly reduceMotion: boolean;
  /** True once a clip has been captured into `/motion/`. */
  readonly hasClip: boolean;
  /** Route where it can be felt live. */
  readonly liveHref?: string;
}

export interface MotionGroup {
  readonly anchor: string;
  /** Trigger heading, e.g. "Hover · cursor". */
  readonly trigger: string;
  readonly description: string;
  readonly items: readonly MotionEffect[];
}
