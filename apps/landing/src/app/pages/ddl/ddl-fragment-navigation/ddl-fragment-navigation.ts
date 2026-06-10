import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  Container,
  Breadcrumb,
  FloatingPillNav,
  Heading,
  ReadingProgress,
  LandingScrollspyService,
  SectionDots,
  TocInline,
  TocSidebar,
  Segmented,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import type { NavPattern } from './ddl-fragment-navigation.types';
import { SECTIONS, LOREM, PATTERN_OPTIONS } from './ddl-fragment-navigation.data';

@Component({
  selector: 'landing-ddl-fragment-navigation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LandingScrollspyService],
  imports: [
    Container,
    Segmented,
    Breadcrumb,
    Heading,
    TocSidebar,
    TocInline,
    SectionDots,
    ReadingProgress,
    FloatingPillNav,
  ],
  template: `
    <!-- Reading progress bar — only with 'dots' pattern -->
    @if (pattern() === 'dots') {
      <landing-reading-progress />
    }

    <!-- Pattern selector header -->
    <div class="border-b border-landing-border bg-ink-1/60 backdrop-blur-sm">
      <landing-container size="wide">
        <div class="flex flex-col gap-3 py-6 tablet:flex-row tablet:items-end tablet:justify-between">
          <div>
            <landing-breadcrumb [items]="breadcrumb" class="mb-3 block" />
            <h1 class="font-display text-display-md text-landing-text-300">Navigation prototypes</h1>
            <p class="font-sans text-body-md text-landing-text-400 mt-2 max-w-2xl">
              Reusable nav components from <code>libs/landing/shared/ui/components/in-page-nav/</code>. Switch the
              pattern to compare. Each renders against the same lorem-ipsum content + scrollspy service.
            </p>
          </div>
          <landing-segmented
            [segments]="patternOptions"
            [active]="pattern()"
            (activeChange)="setPattern($event)"
            ariaLabel="Navigation pattern"
            idPrefix="fragnav-pattern"
            class="block shrink-0"
          />
        </div>
      </landing-container>
    </div>

    <!-- Main content + optional right rail -->
    <landing-container size="wide">
      <div class="grid gap-12 py-12" [class.laptop:grid-cols-[1fr_220px]]="pattern() === 'toc'">
        <article class="space-y-16">
          @if (pattern() === 'inline') {
            <div class="max-w-prose">
              <landing-toc-inline [sections]="sections" />
            </div>
          }
          @for (s of sections; track s.id) {
            <section [id]="s.id">
              <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 mb-2">
                section · {{ $index + 1 }} / {{ sections.length }}
              </p>
              <landing-heading
                [id]="s.id"
                [level]="2"
                class="font-display text-display-sm text-landing-text-300 mb-4 block"
              >
                {{ s.title }}
              </landing-heading>
              <div class="space-y-4 font-sans text-body-md text-landing-text-400 max-w-prose">
                <p>{{ lorem }}</p>
                <p>{{ lorem }}</p>
                <p>{{ lorem }}</p>
              </div>
            </section>
          }
        </article>

        @if (pattern() === 'toc') {
          <aside class="hidden laptop:block">
            <landing-toc-sidebar [sections]="sections" />
          </aside>
        }
      </div>
    </landing-container>

    @if (pattern() === 'fab') {
      <p
        class="fixed bottom-6 left-6 z-30 max-w-xs rounded border border-landing-border bg-ink-1 px-3 py-2 font-mono text-mono-sm text-landing-text-500"
      >
        FAB visible bottom-right (provided by <code>landing-shell</code> on every page).
      </p>
    }

    @if (pattern() === 'dots') {
      <landing-section-dots [sections]="sections" />
    }

    @if (pattern() === 'pill') {
      <landing-floating-pill-nav [sections]="sections" />
    }
  `,
})
export class DdlFragmentNavigation {
  private readonly scrollspy = inject(LandingScrollspyService);

  readonly sections = SECTIONS;
  readonly lorem = LOREM;
  readonly patternOptions = PATTERN_OPTIONS;
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Fragment Navigation' }];

  readonly pattern = signal<NavPattern>('fab');

  constructor() {
    this.scrollspy.setSections(SECTIONS);
  }

  setPattern(value: string): void {
    if (value === 'fab' || value === 'toc' || value === 'inline' || value === 'dots' || value === 'pill') {
      this.pattern.set(value);
    }
  }
}
