import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ContainerComponent,
  LandingBackgroundComponent,
  LandingBreadcrumbComponent,
  SegmentedComponent,
  type BreadcrumbItem,
  type LandingBackgroundPattern,
} from '@portfolio/landing/shared/ui';

type PatternEntry = {
  id: LandingBackgroundPattern;
  label: string;
  hint: string;
  useCase: string;
  bestFor: readonly string[];
  avoidFor: readonly string[];
  sampleHeadline: string;
  sampleTagline: string;
};

const PATTERNS: readonly PatternEntry[] = [
  {
    id: 'blueprint',
    label: 'BLUEPRINT',
    hint: 'Perspective grid floor receding to a vanishing point.',
    useCase:
      'Hero section for the engineering / systems-builder identity. The receding floor reads as "infrastructure, foundations, planning" — supports a type-led hero that names the engineer above the schematic.',
    bestFor: ['Home hero', 'Project case-study openers', 'Colophon "stack" intro'],
    avoidFor: ['Long-form reading sections', 'Card grids (competes with card borders)'],
    sampleHeadline: 'Phuong Tran — Senior Frontend Engineer.',
    sampleTagline: 'Four years shipping fintech tools for the Singapore market.',
  },
  {
    id: 'topo',
    label: 'TOPO',
    hint: 'Concentric ring contour map; two off-centre sources read like elevation.',
    useCase:
      'About / bio sections, or transitions between long-form chapters. The off-centre rings imply "depth, story, terrain" — pairs well with editorial Newsreader display and a quoted pull-line.',
    bestFor: ['About / 90s story', 'Section dividers between case studies', 'Pull-quote backdrops'],
    avoidFor: ['Hero (too soft, not enough structure)', 'Dense data sections'],
    sampleHeadline: 'The work, and the rails behind it.',
    sampleTagline: 'A 90-second story about how five years of fintech turned into a way of working.',
  },
  {
    id: 'hatch',
    label: 'HATCH',
    hint: 'Diagonal pencil hatching, faded top + bottom.',
    useCase:
      'Editorial draftsman feel. Use for "process / craft / sketch" sections — colophon, uses, the "how I work" bands. The hatching softens a section without competing with body type.',
    bestFor: ['Colophon body', '/uses page', 'Section under a pull-quote', 'Footer band'],
    avoidFor: ['Hero (visual weight too even, no focal point)', 'Card grids'],
    sampleHeadline: 'Tools, editor, and the sharp pencils.',
    sampleTagline: 'The actual machine the work gets made on. Versioned, dated, opinionated.',
  },
  {
    id: 'dots',
    label: 'DOT_MATRIX',
    hint: 'Dots at grid intersections, vignette mask. Star-field or measurement-paper.',
    useCase:
      'Data-leaning sections — projects index, timeline, anything that reads like a table or measurement. The dot grid implies precision without the heaviness of a full grid.',
    bestFor: ['Projects index header', 'Timeline / experience', 'Stats panels', 'Skills matrix'],
    avoidFor: ['Long reading prose (eye sees the dots)', 'Heroes asking for emotional weight'],
    sampleHeadline: 'Selected work · 2021 — 2026.',
    sampleTagline: 'Sixteen shipped projects. Three matter; three are linked here.',
  },
  {
    id: 'crosshair',
    label: 'CROSSHAIR',
    hint: 'Radar sweep + concentric rings anchored to one corner.',
    useCase:
      'CTA / contact sections. The "aim" of the radar pulls the eye to the message that asks the reader to act. Pair with one bold call-to-action and a single supporting line.',
    bestFor: ['Contact / get-in-touch', 'Newsletter band', 'Bottom-of-page CTA', '404 page'],
    avoidFor: ['Heroes (too directional, distracts from name)', 'Long-form body'],
    sampleHeadline: 'Get in touch.',
    sampleTagline: 'Open to senior frontend / full-stack roles. Singapore market preferred.',
  },
];

@Component({
  selector: 'landing-backgrounds-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, LandingBackgroundComponent, LandingBreadcrumbComponent, SegmentedComponent],
  template: `
    <div class="border-b border-landing-border bg-ink-1/60">
      <landing-container size="wide">
        <div class="py-6">
          <landing-breadcrumb [items]="breadcrumb" class="mb-3 block" />
          <h1 class="font-display text-display-md text-landing-text-300">Hero background variants</h1>
          <p class="font-sans text-body-md text-landing-text-400 mt-2 max-w-2xl">
            Pure-CSS decorative backgrounds rendered via one <code>landing-background</code> primitive. Pick a pattern,
            see it at hero scale, and read the use-case notes before applying it to a real surface.
          </p>
        </div>
      </landing-container>
    </div>

    <landing-container size="wide">
      <div class="py-8">
        <landing-segmented
          [segments]="segments"
          [active]="active()"
          (activeChange)="setActive($event)"
          ariaLabel="Background pattern"
          idPrefix="bg-pattern"
          class="block"
        />
      </div>
    </landing-container>

    <!-- Hero-scale preview with sample headline overlay -->
    <section class="bg-preview">
      <landing-background [pattern]="active()" />
      <landing-container size="wide">
        <div class="bg-preview__inner">
          <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-accent">
            {{ entry().label }}
          </p>
          <h2 class="font-sans font-semibold text-landing-text-300 bg-preview__headline">
            {{ entry().sampleHeadline }}
          </h2>
          <p class="font-sans text-body-lg text-landing-text-400 mt-4 max-w-2xl">
            {{ entry().sampleTagline }}
          </p>
        </div>
      </landing-container>
    </section>

    <landing-container size="wide">
      <div class="py-12 grid gap-8 tablet:grid-cols-[2fr_1fr]">
        <article>
          <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 mb-2">
            use case · {{ entry().id }}
          </p>
          <h3 class="font-display text-display-sm text-landing-text-300 mb-3">When to reach for {{ entry().id }}</h3>
          <p class="font-sans text-body-md text-landing-text-400 max-w-prose">{{ entry().useCase }}</p>
        </article>

        <aside class="space-y-6">
          <div>
            <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 mb-2">best for</p>
            <ul class="font-sans text-body-md text-landing-text-300 space-y-1">
              @for (item of entry().bestFor; track item) {
                <li class="flex items-baseline gap-2">
                  <span class="font-mono text-mono-sm text-landing-accent">+</span>
                  <span>{{ item }}</span>
                </li>
              }
            </ul>
          </div>
          <div>
            <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 mb-2">avoid for</p>
            <ul class="font-sans text-body-md text-landing-text-500 space-y-1">
              @for (item of entry().avoidFor; track item) {
                <li class="flex items-baseline gap-2">
                  <span class="font-mono text-mono-sm text-landing-text-600">−</span>
                  <span>{{ item }}</span>
                </li>
              }
            </ul>
          </div>
        </aside>
      </div>
    </landing-container>

    <!-- Gallery — all 5 patterns at thumbnail scale for at-a-glance comparison -->
    <div class="border-t border-landing-border">
      <landing-container size="wide">
        <div class="py-12">
          <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 mb-2">
            gallery · all five
          </p>
          <h3 class="font-display text-display-sm text-landing-text-300 mb-6">At a glance</h3>
          <div class="grid gap-4 grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-5">
            @for (p of patterns; track p.id) {
              <button
                type="button"
                class="bg-thumb"
                [class.bg-thumb--active]="p.id === active()"
                (click)="setActive(p.id)"
                [attr.aria-pressed]="p.id === active()"
              >
                <landing-background [pattern]="p.id" />
                <span class="bg-thumb__label">{{ p.label }}</span>
              </button>
            }
          </div>
        </div>
      </landing-container>
    </div>
  `,
  styles: [
    `
      .bg-preview {
        position: relative;
        min-height: 480px;
        overflow: hidden;
        isolation: isolate;
        border-block: 1px solid var(--landing-border);
        background-color: var(--landing-bg);
      }

      .bg-preview__inner {
        padding-block: 96px;
      }

      .bg-preview__headline {
        font-size: var(--landing-display-lg);
        line-height: var(--landing-display-lg-lh);
        letter-spacing: var(--landing-tracking-tight);
        margin-top: 8px;
      }

      .bg-thumb {
        position: relative;
        height: 140px;
        overflow: hidden;
        isolation: isolate;
        border: 1px solid var(--landing-border);
        background-color: var(--landing-bg);
        border-radius: 4px;
        cursor: pointer;
        transition: border-color 200ms ease;
      }

      .bg-thumb:hover,
      .bg-thumb--active {
        border-color: var(--landing-accent);
      }

      .bg-thumb__label {
        position: absolute;
        left: 12px;
        bottom: 12px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-400);
      }

      .bg-thumb--active .bg-thumb__label {
        color: var(--landing-accent);
      }
    `,
  ],
})
export class BackgroundsPage {
  readonly patterns = PATTERNS;
  readonly segments = PATTERNS.map((p) => ({ id: p.id, label: p.label }));
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Backgrounds' }];
  readonly active = signal<LandingBackgroundPattern>('blueprint');
  readonly entry = computed(() => PATTERNS.find((p) => p.id === this.active()) ?? PATTERNS[0]);

  setActive(id: string): void {
    if (this.isPattern(id)) this.active.set(id);
  }

  private isPattern(id: string): id is LandingBackgroundPattern {
    return PATTERNS.some((p) => p.id === id);
  }
}
