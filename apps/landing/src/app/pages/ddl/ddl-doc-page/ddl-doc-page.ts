import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import type { InPageSection } from '@portfolio/landing/shared/ui';

import { DDL_GROUPS, DDL_REGISTRY, entryFragment, entryLink } from '../ddl.registry';
import { DdlDocsService } from '../ddl-docs.service';
import { DdlStatusChip } from '../ddl-status-chip';
import type { DdlDocWidth, DdlEntry } from '../ddl.types';

// Per-page doc shell (§5 anatomy): header (group · title · status · summary)
// → projected body → prev/next pager. Driven by the registry `slug`.
//
// The right-hand TOC is auto-derived from the headings the page actually renders:
// each `<landing-ddl-section>` (an `<section id>` carrying an `<h2>`) is a level-2
// entry, and any `<h3 id>` / `<h4 id>` inside the body nests beneath it. Authors
// get a multi-level TOC just by writing headings with ids — no manual list to keep
// in sync. `data-toc="Short title"` overrides the displayed label when the heading
// text is verbose. The optional `sections` input is only an SSR/no-JS fallback
// (the DOM scan runs in the browser).
@Component({
  selector: 'landing-ddl-doc-page',
  standalone: true,
  imports: [RouterLink, DdlStatusChip],
  templateUrl: './ddl-doc-page.html',
  styleUrl: './ddl-doc-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlDocPage {
  readonly slug = input.required<string>();
  readonly sections = input<readonly InPageSection[]>([]);
  // Ask the shell to size the content column. Default 'wide' (1120px, keeps the
  // right TOC); set 'prose' (768px) for text-only reference pages, or 'full' for
  // full-bleed showcases (full hides the TOC).
  readonly width = input<DdlDocWidth>('wide');

  // Header overrides for pages NOT in the registry (e.g. the /ddl Overview). When
  // a registry entry exists it always wins; these are the fallback. With no entry
  // the status chip + prev/next pager are suppressed.
  readonly eyebrow = input('');
  readonly title = input('');
  readonly summary = input('');

  private readonly docs = inject(DdlDocsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly entry = computed<DdlEntry | undefined>(() => DDL_REGISTRY.find((e) => e.slug === this.slug()));

  protected readonly groupLabel = computed(() => DDL_GROUPS.find((g) => g.id === this.entry()?.group)?.label ?? '');

  // Resolved header fields — registry entry wins, else the override inputs.
  protected readonly displayEyebrow = computed(() => (this.entry() ? this.groupLabel() : this.eyebrow()));
  protected readonly displayTitle = computed(() => this.entry()?.title ?? this.title());
  protected readonly displaySummary = computed(() => this.entry()?.summary ?? this.summary());

  // Prev/next walk the registry but skip deprecated entries, so the reading flow
  // never lands on a hidden doc (it's only reachable by direct URL). A deprecated
  // page itself still pages out to its nearest living neighbours.
  private readonly index = computed(() => DDL_REGISTRY.findIndex((e) => e.slug === this.slug()));
  protected readonly prev = computed<DdlEntry | undefined>(() => this.adjacent(-1));
  protected readonly next = computed<DdlEntry | undefined>(() => this.adjacent(1));

  private adjacent(step: 1 | -1): DdlEntry | undefined {
    const start = this.index();
    if (start < 0) return undefined;
    for (let i = start + step; i >= 0 && i < DDL_REGISTRY.length; i += step) {
      if (DDL_REGISTRY[i].status !== 'deprecated') return DDL_REGISTRY[i];
    }
    return undefined;
  }

  constructor() {
    // SSR / pre-hydration: publish whatever the page declared (may be empty).
    effect(() => this.docs.publish(this.sections()));
    // Hand the requested content width up to the shell.
    effect(() => this.docs.setWidth(this.width()));
    // Browser: upgrade to the real heading tree from the rendered DOM.
    afterNextRender(() => this.publishFromDom());
  }

  protected linkFor(entry: DdlEntry): string {
    return entryLink(entry);
  }

  protected fragmentFor(entry: DdlEntry): string | undefined {
    return entryFragment(entry);
  }

  /** Walk the rendered body and build the TOC from headings carrying an `id`.
   *  Section wrappers (`section.ddl-section[id]`) are level-2; `<h3 id>` / `<h4 id>`
   *  nest under them. `querySelectorAll` returns elements in document order, which
   *  is exactly the order the TOC wants. */
  private publishFromDom(): void {
    const nodes = this.host.nativeElement.querySelectorAll<HTMLElement>('section.ddl-section[id], h3[id], h4[id]');
    const derived: InPageSection[] = Array.from(nodes).map((el) => {
      const isSection = el.tagName === 'SECTION';
      const level: 2 | 3 | 4 = isSection ? 2 : el.tagName === 'H4' ? 4 : 3;
      const raw = isSection
        ? el.querySelector('.ddl-section__heading')?.textContent
        : (el.dataset['toc'] ?? el.textContent);
      return { id: el.id, title: (raw ?? '').trim(), level };
    });
    if (derived.length) this.docs.publish(derived);
  }
}
