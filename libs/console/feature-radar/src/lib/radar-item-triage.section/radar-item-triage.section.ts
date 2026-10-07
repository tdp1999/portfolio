import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { RelativeTime } from '@portfolio/console/shared/ui';
import { isEditableTarget } from '@portfolio/shared/ui';
import { catchError, distinctUntilChanged, map, of, Subject, switchMap, merge, filter } from 'rxjs';
import { RadarItemProgressCell } from '../radar-item-progress.cell/radar-item-progress.cell';
import { RadarItemDetailCard } from '../radar-item.detail-card/radar-item.detail-card';
import { RadarScoreTonePipe } from '../radar-score-tone.pipe';
import { RadarSourceMonogramPipe } from '../radar-source-monogram.pipe';
import { RadarService } from '../radar.service';
import type { RadarFeedItem, RadarItemDetail, RadarTriageDecision, RadarTriageStatus } from '../radar.types';
import { PLATFORM_LABELS, TRIAGE_ROW_MARKS } from '../radar.data';

/**
 * The Feed's Split view with a post open: the page of posts as a compact list, and the open post's
 * record beside it with the triage decisions. The host owns the Feed state (items, tab, selection)
 * and mounts this view only while a post is open; this view renders it, loads the open post,
 * and turns keys into intents. Its keys live only while it is mounted, so the table never sees them.
 */
@Component({
  selector: 'console-radar-item-triage-section',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RadarItemProgressCell,
    RadarItemDetailCard,
    RadarScoreTonePipe,
    RadarSourceMonogramPipe,
    RelativeTime,
  ],
  templateUrl: './radar-item-triage.section.html',
  styleUrl: './radar-item-triage.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarItemTriageSection {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);

  // ── Inputs / outputs ──────────────────────────────────────────────
  readonly items = input.required<RadarFeedItem[]>();
  /** The open post. */
  readonly selectedId = input<string | null>(null);
  /** Feed query params, so "Open full" lands on a Detail page that walks this same view. */
  readonly feedQuery = input<Record<string, string>>({});
  /** Rows before this page, and the tab's total, for the "n of total" counter. */
  readonly offset = input(0);
  readonly total = input(0);
  /** The open tab: a row whose status no longer matches it was decided here and is marked. */
  readonly tab = input<RadarTriageStatus>('INBOX');
  /** A decision is on its way: the buttons and keys wait for it. */
  readonly busy = input(false);

  readonly select = output<string>();
  readonly decide = output<RadarTriageDecision>();
  /** X or Escape: back to the full table. */
  readonly close = output<void>();

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly platformLabels = PLATFORM_LABELS;
  protected readonly detail = signal<RadarItemDetail | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly detailError = signal<'not-found' | 'failed' | null>(null);

  // ── Derived ───────────────────────────────────────────────────────
  /** List rows with their fields resolved once, so the template only reads them. */
  protected readonly rows = computed(() =>
    this.items().map((it) => ({
      id: it.id,
      item: it,
      score: it.enrichment?.signalScore ?? null,
      summary: it.enrichment?.tldr ?? it.preview,
      raw: !it.enrichment,
      decided: it.triageStatus === this.tab() ? null : TRIAGE_ROW_MARKS[it.triageStatus],
      source: it.source,
      publishedAt: it.publishedAt,
    }))
  );

  protected readonly selected = computed(() => this.items().find((it) => it.id === this.selectedId()) ?? null);

  protected readonly position = computed(() => {
    const i = this.items().findIndex((it) => it.id === this.selectedId());
    return i < 0 ? null : this.offset() + i + 1;
  });

  /** The record shown: the loaded detail, as long as it is the selected post's. */
  protected readonly record = computed(() => {
    const d = this.detail();
    return d && d.id === this.selectedId() ? d : null;
  });

  // ── Plain state ───────────────────────────────────────────────────
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly pane = viewChild<ElementRef<HTMLElement>>('pane');
  private readonly reload$ = new Subject<string>();

  constructor() {
    // A fast J/K walk: only the newest post's request may land.
    merge(toObservable(this.selectedId).pipe(distinctUntilChanged()), this.reload$)
      .pipe(
        filter((id): id is string => !!id),
        switchMap((id) => {
          this.detailLoading.set(true);
          this.detailError.set(null);
          return this.radarService.getItem(id).pipe(
            map((item) => ({ item, error: null })),
            catchError((err: HttpErrorResponse) =>
              of({ item: null, error: err.status === 404 ? ('not-found' as const) : ('failed' as const) })
            )
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe(({ item, error }) => {
        // A reload of the same post keeps the pane's scroll; a new post starts at its top.
        if (item && item.id !== this.detail()?.id) this.pane()?.nativeElement.scrollTo({ top: 0 });
        this.detail.set(item);
        this.detailError.set(error);
        this.detailLoading.set(false);
      });

    // Keep the open row in view while J/K walk past the list's edge.
    afterRenderEffect(() => {
      const id = this.selectedId();
      const row = id ? this.list()?.nativeElement.querySelector(`[data-id="${id}"]`) : null;
      row?.scrollIntoView({ block: 'nearest' });
    });
  }

  onRefresh(id: string): void {
    if (id === this.selectedId()) this.reload$.next(id);
  }

  onRetry(): void {
    const id = this.selectedId();
    if (id) this.reload$.next(id);
  }

  onMove(delta: 1 | -1): void {
    const items = this.items();
    const i = items.findIndex((it) => it.id === this.selectedId());
    const next = items[Math.max(0, Math.min(items.length - 1, i + delta))];
    if (next && next.id !== this.selectedId()) this.select.emit(next.id);
  }

  /** E: Done, or back to where the post was when it is already done. */
  onDone(): void {
    this.toggle('DONE');
  }

  /** S: To try, or back to where the post was when it is already saved. */
  onSave(): void {
    this.toggle('SAVED');
  }

  /**
   * J/K or arrows move, E/S decide (pressing again takes the decision back), Escape closes the pane. Yields while typing, to any
   * chord with a modifier, and to overlays (Quick Look, dialogs) that own the keys while open.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isEditableTarget(e.target)) return;
    if (e.target instanceof Element && e.target.closest('.ql-panel, .cdk-overlay-container')) return;
    const handlers: Record<string, () => void> = {
      j: () => this.onMove(1),
      ArrowDown: () => this.onMove(1),
      k: () => this.onMove(-1),
      ArrowUp: () => this.onMove(-1),
      e: () => this.onDone(),
      s: () => this.onSave(),
      Escape: () => this.close.emit(),
    };
    const run = handlers[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!run || (e.shiftKey && e.key.length === 1)) return;
    e.preventDefault();
    run();
  }

  /**
   * Every row of a tab arrived with the tab's status, so pressing the same key again sends the post back to the tab
   * it was decided in (a saved post marked done returns to To try). On its own tab's key it leaves for the Inbox.
   */
  private toggle(status: RadarTriageStatus): void {
    const it = this.selected();
    if (!it || this.busy()) return;
    const back = this.tab() === status ? 'INBOX' : this.tab();
    this.decide.emit({ id: it.id, status: it.triageStatus === status ? back : status });
  }
}
