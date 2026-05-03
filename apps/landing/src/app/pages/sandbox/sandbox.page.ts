import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  ContainerComponent,
  InPageSection,
  LandingFloatingPillNavComponent,
  LandingHeadingComponent,
  LandingReadingProgressComponent,
  LandingScrollspyService,
  LandingSectionDotsComponent,
  LandingTocSidebarComponent,
  SegmentedComponent,
} from '@portfolio/landing/shared/ui';

type NavPattern = 'fab' | 'toc' | 'dots' | 'pill';

const SECTIONS: readonly InPageSection[] = [
  { id: 'intro', title: 'Introduction' },
  { id: 'principles', title: 'Principles' },
  { id: 'tokens', title: 'Tokens & scale' },
  { id: 'typography', title: 'Typography' },
  { id: 'color', title: 'Color system' },
  { id: 'components', title: 'Components' },
  { id: 'patterns', title: 'Patterns' },
  { id: 'motion', title: 'Motion' },
  { id: 'a11y', title: 'Accessibility' },
  { id: 'roadmap', title: 'Roadmap' },
];

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar sic tempor. Sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate, felis tellus mollis orci, sed rhoncus pronin sapien nunc accuan eget. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum.`;

const PATTERN_OPTIONS = [
  { id: 'fab', label: 'Scroll-to-top FAB' },
  { id: 'toc', label: 'Sticky TOC sidebar' },
  { id: 'dots', label: 'Section dots + progress' },
  { id: 'pill', label: 'Floating pill + mini-map' },
];

@Component({
  selector: 'landing-sandbox-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LandingScrollspyService],
  imports: [
    ContainerComponent,
    SegmentedComponent,
    LandingHeadingComponent,
    LandingTocSidebarComponent,
    LandingSectionDotsComponent,
    LandingReadingProgressComponent,
    LandingFloatingPillNavComponent,
  ],
  template: `
    <!-- Reading progress bar — only with 'dots' pattern -->
    @if (pattern() === 'dots') {
      <landing-reading-progress />
    }

    <!-- Pattern selector header -->
    <div class="border-b border-landing-border bg-ink-1/60 backdrop-blur-sm">
      <landing-container size="wide">
        <div class="flex flex-col gap-3 py-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 mb-1">
              sandbox · in-page navigation
            </p>
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
            idPrefix="sandbox-pattern"
            class="block shrink-0"
          />
        </div>
      </landing-container>
    </div>

    <!-- Main content + optional right rail -->
    <landing-container size="wide">
      <div class="grid gap-12 py-12" [class.lg:grid-cols-[1fr_220px]]="pattern() === 'toc'">
        <article class="space-y-16">
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
          <aside class="hidden lg:block">
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
export class SandboxPage {
  private readonly scrollspy = inject(LandingScrollspyService);

  readonly sections = SECTIONS;
  readonly lorem = LOREM;
  readonly patternOptions = PATTERN_OPTIONS;

  readonly pattern = signal<NavPattern>('fab');

  constructor() {
    this.scrollspy.setSections(SECTIONS);
  }

  setPattern(value: string): void {
    if (value === 'fab' || value === 'toc' || value === 'dots' || value === 'pill') {
      this.pattern.set(value);
    }
  }
}
