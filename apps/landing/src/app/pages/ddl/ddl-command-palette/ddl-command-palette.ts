import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Container, Eyebrow, Icon, Breadcrumb, SectionHeader, type BreadcrumbItem } from '@portfolio/landing/shared/ui';
import {
  KIND_LABEL,
  MOCK_RESULTS,
  type SearchResult,
  filterResults,
  groupByKind,
} from '../command-palette/command-palette.data';
import type { FlatRow, Variant } from './ddl-command-palette.types';

@Component({
  selector: 'landing-ddl-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Icon, Breadcrumb, SectionHeader],
  templateUrl: './ddl-command-palette.html',
  styleUrl: './ddl-command-palette.scss',
  host: {
    '(document:keydown)': 'onKey($event)',
  },
})
export class DdlCommandPalette {
  protected readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly rowEls = viewChildren<ElementRef<HTMLElement>>('rowEl');

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Command palette' }];

  /** Active variant — null means no modal open. */
  readonly active = signal<Variant>(null);
  readonly query = signal('');
  readonly cursor = signal(0);

  readonly kindLabels = KIND_LABEL;

  readonly filtered = computed(() => filterResults(this.query(), MOCK_RESULTS));
  readonly grouped = computed(() => groupByKind(this.filtered()));

  /** Flat rows in render order — used for keyboard navigation across group boundaries. */
  readonly flatRows = computed<readonly FlatRow[]>(() => {
    const out: FlatRow[] = [];
    for (const group of this.grouped()) {
      let first = true;
      for (const r of group.items) {
        out.push({ result: r, groupHeader: first ? this.kindLabels[group.kind] : undefined });
        first = false;
      }
    }
    return out;
  });

  /** Flat results (no group header marker) — selection uses index into this. */
  readonly flatResults = computed(() => this.flatRows().map((r) => r.result));

  constructor() {
    // Reset cursor whenever filter result list changes shape.
    effect(() => {
      void this.flatResults();
      this.cursor.set(0);
    });

    // Auto-focus input when a modal opens.
    effect(() => {
      const which = this.active();
      if (which) {
        queueMicrotask(() => this.searchInputRef()?.nativeElement?.focus());
      }
    });

    // Auto-scroll the selected row into view when the cursor moves.
    effect(() => {
      const i = this.cursor();
      const els = this.rowEls();
      if (!this.active()) return;
      queueMicrotask(() => {
        els[i]?.nativeElement?.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  // ─── Open / close ───────────────────────────────────────────────
  open(variant: Variant): void {
    if (!variant) return;
    this.query.set('');
    this.cursor.set(0);
    this.active.set(variant);
  }

  close(): void {
    if (this.active() !== null) {
      this.active.set(null);
    }
  }

  onBackdropClick(event: MouseEvent, hostEl: HTMLElement): void {
    if (event.target === hostEl) {
      this.close();
    }
  }

  // ─── Keyboard ───────────────────────────────────────────────────
  /** Cmd+K / Ctrl+K opens variant 1 (canonical) globally on this page. */
  onKey(event: KeyboardEvent): void {
    // Cmd/Ctrl + K — global open
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.active() === null) {
        this.open('v1');
      } else {
        this.close();
      }
      return;
    }

    if (this.active() === null) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    const total = this.flatResults().length;
    if (total === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.cursor.update((c) => (c + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.cursor.update((c) => (c - 1 + total) % total);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.flatResults()[this.cursor()];
      if (item) this.activate(item);
    }
  }

  // ─── Activate item ──────────────────────────────────────────────
  activate(_item: SearchResult): void {
    // In a real wiring, this would navigate or run the action. Demo just closes.
    this.close();
  }

  onQueryInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
  }
}
