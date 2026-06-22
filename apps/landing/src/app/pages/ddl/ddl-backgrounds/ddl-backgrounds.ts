import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Background, Segmented, type LandingBackgroundPattern } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { PATTERNS } from './ddl-backgrounds.data';

@Component({
  selector: 'landing-ddl-backgrounds',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Background, Segmented, DdlDocPage],
  template: `
    <landing-ddl-doc-page slug="backgrounds" [width]="'full'">
      <p class="bg-lead font-sans text-body-md text-landing-text-400 max-w-2xl">
        Pure-CSS decorative backgrounds rendered via one <code>landing-background</code> primitive. Pick a pattern, see
        it at hero scale, and read the use-case notes before applying it to a real surface.
      </p>

      <landing-segmented
        [segments]="segments"
        [active]="active()"
        (activeChange)="setActive($event)"
        ariaLabel="Background pattern"
        idPrefix="bg-pattern"
        class="block"
      />

      <!-- Hero-scale preview with sample headline overlay -->
      <section class="bg-preview">
        <landing-background [pattern]="active()" />
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
      </section>

      <!-- Use-case notes -->
      <div class="grid gap-8 tablet:grid-cols-[2fr_1fr]">
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

      <!-- Gallery — all five patterns at thumbnail scale for at-a-glance comparison -->
      <div>
        <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 mb-2">gallery · all five</p>
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
    </landing-ddl-doc-page>
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
export class DdlBackgrounds {
  readonly patterns = PATTERNS;
  readonly segments = PATTERNS.map((p) => ({ id: p.id, label: p.label }));
  readonly active = signal<LandingBackgroundPattern>('blueprint');
  readonly entry = computed(() => PATTERNS.find((p) => p.id === this.active()) ?? PATTERNS[0]);

  setActive(id: string): void {
    if (this.isPattern(id)) this.active.set(id);
  }

  private isPattern(id: string): id is LandingBackgroundPattern {
    return PATTERNS.some((p) => p.id === id);
  }
}
