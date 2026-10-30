import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { RelativeTime } from '@portfolio/console/shared/ui';
import { isEditableTarget } from '@portfolio/shared/ui';
import { catchError, distinctUntilChanged, finalize, map, of, Subject, switchMap, merge, filter } from 'rxjs';
import { RadarItemProgressCell } from '../radar-item-progress.cell/radar-item-progress.cell';
import { RadarItemDetailCard } from '../radar-item.detail-card/radar-item.detail-card';
import { RadarItemReanalyzeDialog } from '../radar-item.reanalyze-dialog/radar-item.reanalyze-dialog';
import { isReanalysisQueued } from '../radar-item.util';
import { RadarScoreTonePipe } from '../radar-score-tone.pipe';
import { RadarSourceMonogramPipe } from '../radar-source-monogram.pipe';
import { RadarService } from '../radar.service';
import { triageBounds, triageToggle, walkStep } from '../radar-triage.util';
import type {
  RadarFeedItem,
  RadarItemDetail,
  RadarNotesChange,
  RadarReanalyzeDialogData,
  RadarTriageDecision,
  RadarTriageStatus,
  ReanalyzeItemsResult,
} from '../radar.types';
import { NOTE_MAX_CHARS } from '../radar.constants';
import { NOTE_PROMPTS, PLATFORM_LABELS, TRIAGE_ROW_MARKS } from '../radar.data';

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
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
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
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly rowSelect = output<string>();
  /** The walk ran past this page's edge while the Feed has more: the host loads the adjacent page. */
  readonly pageStep = output<1 | -1>();
  readonly decide = output<RadarTriageDecision>();
  /** X or Escape: back to the full table. */
  readonly closed = output<void>();
  /** A note was added or removed here: the host updates that post's note summary. */
  readonly notesChange = output<RadarNotesChange>();

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly platformLabels = PLATFORM_LABELS;
  protected readonly detail = signal<RadarItemDetail | null>(null);
  protected readonly detailLoading = signal(false);
  protected readonly detailError = signal<'not-found' | 'failed' | null>(null);
  /** The quick note under the decision bar: open after a decision (or N), for that post only. */
  protected readonly noteAsk = signal<{ itemId: string; status: RadarTriageStatus | null } | null>(null);
  protected readonly noteSaving = signal(false);
  /** Bumped after a quick note is saved, so the card's notes list reloads. */
  protected readonly notesRevision = signal(0);
  protected readonly noteControl = new FormControl('', { nonNullable: true });
  protected readonly noteMaxChars = NOTE_MAX_CHARS;

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

  /** The walk stops at the Feed's ends, not the page's: the host crosses page boundaries. */
  private readonly bounds = computed(() => triageBounds(this.position(), this.total()));
  protected readonly atFirst = computed(() => this.bounds().atFirst);
  protected readonly atLast = computed(() => this.bounds().atLast);

  /** The record shown: the loaded detail, as long as it is the selected post's. */
  protected readonly record = computed(() => {
    const d = this.detail();
    return d && d.id === this.selectedId() ? d : null;
  });

  /** The open quick note's prompt, only while it belongs to the open post. */
  protected readonly notePrompt = computed(() => {
    const ask = this.noteAsk();
    return ask && ask.itemId === this.selectedId() ? NOTE_PROMPTS[ask.status ?? 'NONE'] : null;
  });

  /** Analyze (never analyzed) or Re-analyze, hidden while a re-analysis is already queued. */
  protected readonly analyzeAction = computed(() => {
    const rec = this.record();
    if (!rec || isReanalysisQueued(rec)) return null;
    return rec.enrichment
      ? { label: 'Re-analyze', icon: 'refresh' }
      : { label: 'Analyze this post', icon: 'auto_awesome' };
  });

  // ── Plain state ───────────────────────────────────────────────────
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly pane = viewChild<ElementRef<HTMLElement>>('pane');
  private readonly noteInput = viewChild<ElementRef<HTMLInputElement>>('noteInput');
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

    // Another post: the quick note was for the previous one, so it closes empty.
    effect(() => {
      if (this.noteAsk()?.itemId !== this.selectedId()) this.closeNote();
    });

    // The quick note takes the focus as it opens, so the reason can be typed right away.
    afterRenderEffect(() => {
      if (this.notePrompt()) this.noteInput()?.nativeElement.focus();
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
    const step = walkStep(
      this.items().map((it) => it.id),
      this.selectedId(),
      delta,
      this.bounds()
    );
    if (step?.kind === 'select') this.rowSelect.emit(step.id);
    else if (step) this.pageStep.emit(step.delta);
  }

  /** Queues this post for analysis, then reloads it so the queued state shows. */
  onAnalyze(): void {
    const id = this.selectedId();
    if (!id) return;
    this.dialog
      .open<RadarItemReanalyzeDialog, RadarReanalyzeDialogData, ReanalyzeItemsResult>(RadarItemReanalyzeDialog, {
        data: { ids: [id] },
        width: '480px',
      })
      .afterClosed()
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onRefresh(id));
  }

  /** Enter saves the quick note (an empty one just closes it); it carries the decision it explains. */
  onNoteSubmit(): void {
    const ask = this.noteAsk();
    const body = this.noteControl.value.trim();
    if (!ask || this.noteSaving()) return;
    if (!body) {
      this.closeNote();
      return;
    }
    this.noteSaving.set(true);
    this.radarService
      .createNote(ask.itemId, body, ask.status)
      .pipe(finalize(() => this.noteSaving.set(false)))
      .subscribe((note) => {
        // Counted from the row as it is now, not at submit: the list may have reloaded meanwhile.
        const count = this.items().find((it) => it.id === ask.itemId)?.notes.count ?? 0;
        this.notesChange.emit({ id: ask.itemId, notes: { count: count + 1, latest: note } });
        this.notesRevision.update((n) => n + 1);
        // A newer quick note (another post, or N again) may be open by now: leave it be.
        if (this.noteAsk() === ask) this.closeNote();
      });
  }

  /** Enter saves, Esc skips the note; up/down on an empty note skip it and keep walking. */
  onNoteKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      this.onNoteSubmit();
      return;
    }
    const walk = { ArrowDown: 1, ArrowUp: -1 }[e.key] as 1 | -1 | undefined;
    if (e.key === 'Escape' || (walk && !this.noteControl.value.trim())) {
      e.preventDefault();
      e.stopPropagation();
      this.closeNote();
      if (walk) this.onMove(walk);
    }
  }

  onNoteDismiss(): void {
    this.closeNote();
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
   * J/K or arrows move, E/S decide (pressing again takes the decision back), N opens a note, O opens the original post, Escape closes the pane. Yields while typing, to any
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
      n: () => this.openNote(null),
      o: () => this.onOpenOriginal(),
      Escape: () => this.closed.emit(),
    };
    const run = handlers[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    if (!run || (e.shiftKey && e.key.length === 1)) return;
    e.preventDefault();
    run();
  }

  /** Applies a decision key, or takes it back (see `triageToggle`). */
  private toggle(status: RadarTriageStatus): void {
    const it = this.selected();
    if (!it || this.busy()) return;
    const next = triageToggle(it.triageStatus, this.tab(), status);
    this.decide.emit({ id: it.id, status: next });
    // A decision asks why; taking one back (to the Inbox) does not.
    if (next === 'INBOX') this.closeNote();
    else this.openNote(next);
  }

  /** O: the original post in a new tab. */
  onOpenOriginal(): void {
    const url = this.selected()?.permalink;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  /** The phone menu's way to the quick note (N on a keyboard). */
  protected onAddNote(): void {
    this.openNote(null);
  }

  private openNote(status: RadarTriageStatus | null): void {
    const id = this.selectedId();
    if (!id) return;
    this.noteControl.reset();
    this.noteAsk.set({ itemId: id, status });
  }

  private closeNote(): void {
    if (!this.noteAsk()) return;
    this.noteAsk.set(null);
    this.noteControl.reset();
  }
}
