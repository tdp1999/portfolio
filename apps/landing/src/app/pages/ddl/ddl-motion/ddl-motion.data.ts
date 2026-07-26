import type { MotionGroup } from './ddl-motion.types';

// Catalogue of SHIPPED landing motion, grouped by trigger. Sourced from a
// codebase motion inventory (2026-07-26). Clips captured via Playwright video +
// ffmpeg (see the capture pipeline). Entries with `hasClip: false` are documented
// but their loop clip is not captured yet — the card renders a "clip pending"
// state and fills in automatically once `/motion/<id>.{webm,mp4}` exist.
export const MOTION_GROUPS: readonly MotionGroup[] = [
  {
    anchor: 'hover',
    trigger: 'Hover · cursor',
    description:
      'Triggered by pointer hover. Lightweight, high frequency — the default tier for “feels polished” without ceremony.',
    items: [
      {
        id: 'mega-menu-mist',
        name: 'Mega-menu screenshot → mist',
        mechanism: 'Product screenshot fades opacity 1 → 0.3 (220ms), thinning to reveal the icon tile beneath.',
        file: 'components/mega-menu/mega-menu.scss:334',
        scope: 'header mega-menu',
        reduceMotion: true,
        hasClip: true,
        liveHref: '/',
      },
      {
        id: 'arrow-liftoff',
        name: 'Link / button arrow lift-off',
        mechanism:
          'Lead arrow springs translate(±6px) scale(1.05) on a bouncy cubic-bezier; a ghost copy fades to accent.',
        file: 'components/link/link.scss:93',
        scope: 'whole-landing',
        reduceMotion: true,
        hasClip: true,
        liveHref: '/document-engine',
      },
      {
        id: 'status-dot-radar',
        name: 'Status-dot radar ring',
        mechanism: '::after ring scale(1) → scale(4) + fade, one-shot 900ms, only in the “available” state.',
        file: 'components/status-dot/status-dot.scss:80',
        scope: 'home / about hero',
        keyframe: 'landing-status-dot-radar',
        reduceMotion: true,
        hasClip: false,
        liveHref: '/',
      },
    ],
  },
  {
    anchor: 'click',
    trigger: 'Click · tap',
    description: 'Confirmation that an action registered — a pop-in, an overlay, a disclosure expanding.',
    items: [
      {
        id: 'mega-menu-pop',
        name: 'Mega-menu panel pop-in',
        mechanism: 'Panel enters opacity + translateY(-6px) scale(0.98) → none, 200ms cubic-bezier(0.16,1,0.3,1).',
        file: 'components/mega-menu/mega-menu.scss:420',
        scope: 'header',
        keyframe: 'mega-menu-pop-center',
        reduceMotion: true,
        hasClip: true,
        liveHref: '/',
      },
      {
        id: 'command-palette',
        name: 'Command-palette open',
        mechanism: 'Backdrop blur(6→20px) fades in (160ms) + modal translateY(-6px) scale(0.98) → none (200ms).',
        file: 'components/command-palette/command-palette.scss:20',
        scope: 'command palette',
        keyframe: 'cp-modal-in',
        reduceMotion: true,
        hasClip: false,
        liveHref: '/ddl/command-palette',
      },
      {
        id: 'show-more',
        name: 'Show-more expand',
        mechanism: 'max-height clamp releases + chevron rotate(180deg) 200ms + bottom mask-image fade.',
        file: 'components/show-more/show-more.scss:28',
        scope: 'project detail',
        reduceMotion: true,
        hasClip: false,
      },
      {
        id: 'lightbox-open',
        name: 'Lightbox open + slide',
        mechanism: 'Scrim blur(8px) + fade; track slides transform 240ms cubic-bezier(0.22,1,0.36,1).',
        file: 'components/lightbox-overlay/lightbox-overlay.scss:60',
        scope: 'figures / galleries',
        keyframe: 'lightbox-fade',
        reduceMotion: true,
        hasClip: false,
      },
    ],
  },
  {
    anchor: 'idle',
    trigger: 'Idle · ambient',
    description: 'Runs on time, no user action. Kept sparse — at most one motion per viewport at a time.',
    items: [
      {
        id: 'de-marquee',
        name: 'Document Engine proof marquee',
        mechanism: 'Duplicated track translateX 0 → -50%, 42s linear infinite; pauses on hover.',
        file: 'pages/document-engine/document-engine.scss:443',
        scope: 'document-engine',
        keyframe: 'de-marquee-scroll',
        reduceMotion: true,
        hasClip: true,
        liveHref: '/document-engine',
      },
      {
        id: 'spotlight-bloom',
        name: 'Spotlight cursor bloom',
        mechanism:
          'Radial-gradient overlay tracks the cursor via CSS vars; opacity eases 240ms. Off on coarse pointers.',
        file: 'directives/spotlight/spotlight.directive.ts:72',
        scope: 'whole-landing',
        reduceMotion: true,
        hasClip: false,
        liveHref: '/',
      },
    ],
  },
  {
    anchor: 'page-transition',
    trigger: 'Page transition',
    description: 'On route navigation. Softens the swap between pages.',
    items: [
      {
        id: 'router-progress',
        name: 'Router progress bar',
        mechanism:
          'Indeterminate translateX(-100% → 350%) 1.1s infinite during Angular Router navigations + opacity fade.',
        file: 'components/router-progress/router-progress.ts:59',
        scope: 'whole-landing',
        keyframe: 'router-progress-slide',
        reduceMotion: true,
        hasClip: false,
      },
    ],
  },
  {
    anchor: 'load',
    trigger: 'Load · enter',
    description: 'Plays once as an element enters — a first-paint settle.',
    items: [
      {
        id: 'stagger-text',
        name: 'Hero name per-character stagger',
        mechanism: 'SSR-rendered per-char spans fade-up translateY → 0 with a staggered animation-delay.',
        file: 'components/stagger-text/stagger-text.scss:21',
        scope: 'home hero',
        keyframe: 'fx-stagger-text-settle',
        reduceMotion: true,
        hasClip: false,
        liveHref: '/',
      },
    ],
  },
  {
    anchor: 'scroll',
    trigger: 'Scroll · reveal',
    description: 'Tied to scroll position. Used sparingly — the brand leans against scroll-triggered reveals.',
    items: [
      {
        id: 'de-scroll-rise',
        name: 'Document Engine band rise',
        mechanism: 'Bands translateY(16px) + opacity, driven purely by animation-timeline: view() (no JS observer).',
        file: 'pages/document-engine/document-engine.scss:1321',
        scope: 'document-engine',
        keyframe: 'de-rise',
        reduceMotion: true,
        hasClip: false,
        liveHref: '/document-engine',
      },
    ],
  },
];
