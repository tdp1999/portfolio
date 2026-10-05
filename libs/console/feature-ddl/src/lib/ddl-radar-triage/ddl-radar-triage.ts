import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  Property,
  PropertyList,
  RecordField,
  RecordLayout,
  RecordPanel,
  RecordSection,
  SegmentedControl,
} from '@portfolio/console/shared/ui';
import {
  DENSITY_OPTIONS,
  PROVIDER_FILTER,
  SCORE_FILTER,
  SCREEN_OPTIONS,
  SCREENS,
  SIDEBAR_OPTIONS,
  SORT_OPTIONS,
  TRIAGE_ITEMS,
  TYPE_FILTER,
} from './ddl-radar-triage.data';
import type { TriageDensity, TriageItem, TriageSort, TriageStatus } from './ddl-radar-triage.types';

/**
 * Radar triage study, layout A: Feed controls on top, list and the full record view side by side.
 * The frame simulates the content width a given screen and sidebar leave, so the width budget can
 * be judged on one monitor. Keyboard is scoped to the frame; nothing registers a global shortcut.
 */
@Component({
  selector: 'console-ddl-radar-triage',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    FilterBar,
    FilterSearch,
    FilterSelect,
    Property,
    PropertyList,
    RecordField,
    RecordLayout,
    RecordPanel,
    RecordSection,
    SegmentedControl,
  ],
  templateUrl: './ddl-radar-triage.html',
  styleUrl: './ddl-radar-triage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DdlRadarTriage {
  // ── Writable signals ──────────────────────────────────────────────
  protected readonly screen = signal('1440');
  protected readonly sidebar = signal('240');
  protected readonly density = signal<TriageDensity>('comfortable');
  protected readonly view = signal<TriageStatus>('inbox');
  protected readonly items = signal<TriageItem[]>(TRIAGE_ITEMS.map((it) => ({ ...it })));
  protected readonly selectedId = signal<string | null>(TRIAGE_ITEMS[0].id);
  protected readonly search = signal('');
  protected readonly provider = signal('');
  protected readonly type = signal('');
  protected readonly minScore = signal('');
  protected readonly includePromo = signal(false);
  protected readonly sort = signal<TriageSort>('newest');
  protected readonly lastAction = signal<{ ids: string[]; from: TriageStatus; label: string } | null>(null);

  // ── Derived ───────────────────────────────────────────────────────
  /** What the shell leaves: viewport − sidebar − `p-8` on both sides, capped at `--console-page-max`. */
  protected readonly frameWidth = computed(() => {
    const vp = SCREENS.find((s) => s.value === this.screen())?.width ?? 1440;
    return Math.min(1440, vp - Number(this.sidebar()) - 64);
  });
  protected readonly listWidth = computed(() => (this.density() === 'compact' ? 320 : 360));
  protected readonly paneWidth = computed(() => this.frameWidth() - this.listWidth() - 1);
  /** Mirrors the container query in the SCSS, only to print the budget line. */
  protected readonly railBeside = computed(() => this.paneWidth() >= 920);

  /** Filtered + sorted Feed, before the status tab. */
  private readonly filtered = computed(() => {
    const q = this.search().toLowerCase();
    const min = Number(this.minScore() || 0);
    const list = this.items().filter(
      (it) =>
        (!q || it.tldr.toLowerCase().includes(q) || it.text.toLowerCase().includes(q)) &&
        (!this.provider() || it.providers.includes(this.provider())) &&
        (!this.type() || it.type === this.type()) &&
        (it.score ?? 0) >= min &&
        (this.includePromo() || !it.promo)
    );
    const by: Record<TriageSort, (a: TriageItem, b: TriageItem) => number> = {
      newest: (a, b) => a.ageDays - b.ageDays,
      oldest: (a, b) => b.ageDays - a.ageDays,
      score: (a, b) => (b.score ?? -1) - (a.score ?? -1),
      source: (a, b) => a.source.localeCompare(b.source),
    };
    return [...list].sort(by[this.sort()]);
  });
  protected readonly visible = computed(() => this.filtered().filter((it) => it.status === this.view()));
  protected readonly counts = computed(() => {
    const c = { inbox: 0, saved: 0, done: 0 };
    for (const it of this.filtered()) c[it.status]++;
    return c;
  });
  protected readonly selected = computed<TriageItem | null>(
    () => this.visible().find((it) => it.id === this.selectedId()) ?? this.visible().at(0) ?? null
  );
  protected readonly position = computed(() => {
    const sel = this.selected();
    return sel ? this.visible().indexOf(sel) + 1 : 0;
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly screenOptions = SCREEN_OPTIONS;
  protected readonly sidebarOptions = SIDEBAR_OPTIONS;
  protected readonly densityOptions = DENSITY_OPTIONS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly providerOptions = PROVIDER_FILTER;
  protected readonly typeOptions = TYPE_FILTER;
  protected readonly scoreOptions = SCORE_FILTER;
  protected readonly views: { value: TriageStatus; label: string }[] = [
    { value: 'inbox', label: 'Inbox' },
    { value: 'saved', label: 'To try' },
    { value: 'done', label: 'Done' },
  ];

  onKeydown(e: KeyboardEvent): void {
    // The search box and selects own their keys; the triage keys apply to the list and pane only.
    const target = e.target as HTMLElement;
    if (e.metaKey || e.ctrlKey || e.altKey || target.closest('input, textarea, mat-select, console-filter-bar')) return;
    const sel = this.selected();
    const handlers: Record<string, () => void> = {
      j: () => this.onMove(1),
      ArrowDown: () => this.onMove(1),
      k: () => this.onMove(-1),
      ArrowUp: () => this.onMove(-1),
      e: () => sel && this.setStatus([sel.id], 'done'),
      s: () => sel && this.setStatus([sel.id], sel.status === 'saved' ? 'inbox' : 'saved'),
      u: () => this.onUndo(),
    };
    const run = handlers[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  }

  onSelect(id: string): void {
    this.selectedId.set(id);
  }

  onView(view: TriageStatus): void {
    this.view.set(view);
    this.selectedId.set(this.visible()[0]?.id ?? null);
  }

  onMove(delta: number): void {
    const list = this.visible();
    const i = list.findIndex((it) => it.id === this.selected()?.id);
    const next = list[Math.max(0, Math.min(list.length - 1, i + delta))];
    if (next) this.onSelect(next.id);
  }

  onUndo(): void {
    const last = this.lastAction();
    if (!last) return;
    this.items.update((list) => list.map((it) => (last.ids.includes(it.id) ? { ...it, status: last.from } : it)));
    this.selectedId.set(last.ids[0]);
    this.lastAction.set(null);
  }

  /** Changes status, then auto-advances to the post that took the acted one's place. */
  setStatus(ids: string[], status: TriageStatus): void {
    if (!ids.length) return;
    const from = this.items().find((it) => it.id === ids[0])?.status ?? 'inbox';
    const index = this.visible().findIndex((it) => it.id === ids[0]);
    this.items.update((list) => list.map((it) => (ids.includes(it.id) ? { ...it, status } : it)));
    const after = this.visible();
    this.selectedId.set(after[Math.min(index, after.length - 1)]?.id ?? null);
    const label = status === 'done' ? 'Marked done' : status === 'saved' ? 'Saved to To try' : 'Moved to Inbox';
    this.lastAction.set({ ids, from, label });
  }

  protected scoreTone(score: number | null): string {
    if (score === null) return 'tr-score--pending';
    if (score >= 7) return 'tr-score--high';
    if (score >= 4) return 'tr-score--mid';
    return 'tr-score--low';
  }

  /** The seed's apply notes carry `**bold**`; the study shows them as plain text. */
  protected plain(md: string | null): string {
    return (md ?? '').replace(/\*\*/g, '');
  }
}
