import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContainerComponent, LandingBreadcrumbComponent, type BreadcrumbItem } from '@portfolio/landing/shared/ui';

type WishlistItem = {
  readonly title: string;
  readonly detail: string;
  readonly scope: 'whole-landing' | 'home' | 'project-detail';
  readonly effort: 'S' | 'M' | 'L';
};

type WishlistGroup = {
  readonly category: string;
  readonly description: string;
  readonly items: readonly WishlistItem[];
};

/**
 * /ddl/interactions — landing-wide micro-interaction wishlist.
 *
 * Each item is a candidate, not a commitment. Mark ★ to open a task.
 * Grouped by trigger category so it's easy to see coverage gaps
 * (e.g., "we have lots of hover ideas but nothing on idle").
 */
@Component({
  selector: 'landing-interactions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, LandingBreadcrumbComponent],
  templateUrl: './interactions.page.html',
  styleUrl: './interactions.page.scss',
})
export class InteractionsPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Interactions' }];

  readonly groups: readonly WishlistGroup[] = [
    {
      category: 'Hover · cursor',
      description:
        'Triggered by mouse hover. Lightweight, high frequency. Default tier for "feels polished" without ceremony.',
      items: [
        {
          title: 'Section eyebrows: numeric tick',
          detail:
            'Hover NN · Label → mono digit briefly ticks to next number then back (≤80ms Y bounce). Hints "this anchors to a section."',
          scope: 'whole-landing',
          effort: 'S',
        },
        {
          title: 'Chip stack: underline draw-in',
          detail: 'Hover on a tech chip → 1px accent underline draws left→right (160ms). No scale, no color flash.',
          scope: 'whole-landing',
          effort: 'S',
        },
        {
          title: 'Project tab buttons: directional feedback',
          detail:
            'Hover unselected tab → eyebrow index ticks toward the active tab\'s direction, signalling "you\'re moving here."',
          scope: 'home',
          effort: 'M',
        },
        {
          title: 'Spotlight intensity bloom near accent CTAs',
          detail:
            'Existing fxSpotlight: when cursor enters within ~40px of an indigo CTA, intensity grows 1.2× briefly.',
          scope: 'whole-landing',
          effort: 'M',
        },
      ],
    },
    {
      category: 'Click · feedback',
      description: 'Confirmation that the action registered. Inline icon swap is the locked pattern (see §D).',
      items: [
        {
          title: 'Copy-to-clipboard: inline check swap',
          detail:
            'Locked. Icon copy → check, 1.5s revert. Applies to email, repo URLs, slug copy buttons, etc. — wire via shared service/directive.',
          scope: 'whole-landing',
          effort: 'S',
        },
        {
          title: 'Theme toggle: 280ms surface crossfade + 1-frame highlight',
          detail:
            'All surfaces (bg, text, borders) transition for 280ms. Toggle button itself gets a 16ms accent flash to confirm the click landed.',
          scope: 'whole-landing',
          effort: 'M',
        },
        {
          title: 'Anchor links: target section pulse',
          detail:
            "Click NN eyebrow or pill-nav item → smooth scroll + target section's top accent rule pulses once (1s).",
          scope: 'whole-landing',
          effort: 'M',
        },
        {
          title: 'Button press: 1-frame inset shadow',
          detail: 'Primary buttons get a brief inset shadow on active state (mousedown). Releases on mouseup. Tactile.',
          scope: 'whole-landing',
          effort: 'S',
        },
      ],
    },
    {
      category: 'Scroll · ambient',
      description:
        'Triggered by scroll position. Use sparingly — the brand direction explicitly says "no scroll-triggered reveal."',
      items: [
        {
          title: 'Hero blueprint grid: scroll-tied parallax',
          detail: 'Grid translateY 0→24px tied to scroll progress within hero only. Pauses outside hero range.',
          scope: 'home',
          effort: 'M',
        },
        {
          title: 'Section rule lines: one-shot draw-in',
          detail:
            'When a section rule crosses 80% viewport, draw left→right. Only fires once per section (no replay on scroll-up).',
          scope: 'whole-landing',
          effort: 'M',
        },
        {
          title: 'Project detail sticky sidebar: active ToC dim',
          detail: 'Already planned in E5. Inactive ToC items dim to text-700 opacity; active brightens to accent.',
          scope: 'project-detail',
          effort: 'S',
        },
      ],
    },
    {
      category: 'Focus · keyboard',
      description: 'Triggered by Tab navigation. Must be visible — accessibility hard requirement.',
      items: [
        {
          title: 'Card focus: accent rim + lift',
          detail:
            'Tab onto a card → border-color shifts to accent + translateY(-2px). Replaces default browser outline inside landing surfaces.',
          scope: 'whole-landing',
          effort: 'S',
        },
        {
          title: 'Skip-to-content link: fade-in from top',
          detail: 'Hidden visually until Tab focused, then slides down from top with mono caps "SKIP TO CONTENT →".',
          scope: 'whole-landing',
          effort: 'S',
        },
        {
          title: 'Focus trap on opened command palette (when added)',
          detail: '⌘K palette mentioned in E5 stub. When opened, Tab cycles within palette + Esc closes. Future task.',
          scope: 'whole-landing',
          effort: 'L',
        },
      ],
    },
    {
      category: 'Idle · life signs',
      description:
        'Triggered by time, no user action required. Risk: distraction. Always cap to ≤1 motion at a time per viewport.',
      items: [
        {
          title: 'Status dot: slow pulse when AVAILABLE',
          detail:
            '3s pulse cycle, opacity 0.6 → 1 → 0.6. Only when state="available"; busy stays static. Pauses if tab hidden.',
          scope: 'home',
          effort: 'S',
        },
        {
          title: 'Live clock: minute-tick underline blink',
          detail:
            'When the minute value changes, a 1px accent underline blinks once (200ms). Pairs with §C type-out for fuller TZ change.',
          scope: 'home',
          effort: 'S',
        },
        {
          title: 'Aurora blobs: slow drift loop',
          detail:
            'Very slow translation (12s ease-in-out) on the 3 blobs. Pauses while user is scrolling (passive scroll listener).',
          scope: 'home',
          effort: 'M',
        },
      ],
    },
    {
      category: 'Page transitions',
      description: 'Triggered on route navigation. Prevents harsh swap between pages.',
      items: [
        {
          title: 'Router-outlet fade',
          detail:
            'Fade out 90ms → fade in 180ms on route change. Apply at landing-shell layer with Angular animations.',
          scope: 'whole-landing',
          effort: 'M',
        },
        {
          title: 'Project detail hero: mask reveal',
          detail:
            'Hero image enters with linear-gradient mask sweeping from bottom (600ms ease-out). One-shot, no replay.',
          scope: 'project-detail',
          effort: 'M',
        },
      ],
    },
  ];

  totalItems = this.groups.reduce((sum, g) => sum + g.items.length, 0);
}
