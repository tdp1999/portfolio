import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  EnumLabelPipe,
  HelpButton,
  Money,
  RelativeTime,
  SkeletonTable,
  ToastService,
} from '@portfolio/console/shared/ui';
import { catchError, EMPTY, filter, finalize, interval, map, of, Subscription, switchMap, tap } from 'rxjs';
import { RadarRunCreateDialog } from '../radar-run.create.dialog/radar-run.create.dialog';
import {
  awaitsUpload,
  displayStatus,
  isRunActive,
  itemsDetail,
  runNotice,
  stepSummary,
  stepTooltip,
} from '../radar-run.util';
import { RUN_POLL_MS } from '../radar.constants';
import {
  RUN_FLOW_HELP,
  RUN_FLOW_LABELS,
  RUN_STATUS_BADGES,
  RUN_STATUS_LABELS,
  RUN_STEP_ICONS,
  RUN_STEP_LABELS,
} from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarRun, RadarRunCreateDialogData, RadarRunRow } from '../radar.types';

@Component({
  selector: 'console-radar-run-list',
  standalone: true,
  imports: [
    HelpButton,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    EnumLabelPipe,
    Money,
    RelativeTime,
    SkeletonTable,
  ],
  templateUrl: './radar-run.list.html',
  styleUrl: './radar-run.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarRunList implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly runs = signal<RadarRun[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly busyRunId = signal<string | null>(null);
  protected readonly opening = signal(false);

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly activeCount = computed(() => this.runs().filter(isRunActive).length);
  /** On the free tier the AI spend is what the calls would cost at list price, not a charge. */
  protected readonly spendIsEstimate = toSignal(
    this.radarService.aiSettings().pipe(
      map((s) => s.billing === 'free'),
      // A failed load must not break the page: the spend just shows without the estimate note.
      catchError(() => of(false))
    ),
    { initialValue: false }
  );

  /** Each run with what its row shows precomputed, so the template only reads fields. */
  protected readonly rows = computed<RadarRunRow[]>(() =>
    this.runs().map((run) => ({
      ...run,
      displayStatus: displayStatus(run),
      active: isRunActive(run),
      awaitingUpload: awaitsUpload(run),
      notice: runNotice(run),
      stepSummary: stepSummary(run),
      itemsDetail: itemsDetail(run),
      flowHelp: RUN_FLOW_HELP[run.flow],
      steps: run.steps.map((step) => ({ ...step, tooltip: stepTooltip(step) })),
    }))
  );

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly displayedColumns = [
    'source',
    'window',
    'status',
    'steps',
    'items',
    'spend',
    'createdAt',
    'actions',
  ];
  protected readonly flowLabels = RUN_FLOW_LABELS;
  protected readonly statusLabels = RUN_STATUS_LABELS;
  protected readonly statusBadges = RUN_STATUS_BADGES;
  protected readonly stepLabels = RUN_STEP_LABELS;
  protected readonly stepIcons = RUN_STEP_ICONS;
  private pollSub?: Subscription;

  /**
   * `when` predicate of the notice row (a mat-table input, not a template call): only runs that need
   * the Owner get one, or that finished with a warning (comments skipped or partial).
   */
  protected readonly hasNotice = (_: number, row: RadarRunRow): boolean => row.notice !== null || !!row.warning;

  ngOnInit(): void {
    this.loadRuns();
  }

  onRetry(): void {
    this.loading.set(true);
    this.loadRuns();
  }

  // ── New run ───────────────────────────────────────────────────────
  /** Sources load on open, not on page load: the list can change in the Sources dialog meanwhile. */
  onNewRun(): void {
    this.opening.set(true);
    this.radarService
      .listSources()
      .pipe(
        finalize(() => this.opening.set(false)),
        map((all) => all.filter((s) => s.isActive)),
        tap((sources) => {
          if (!sources.length) this.toast.warning('Add or resume a source first, from Sources and upload on the Feed.');
        }),
        filter((sources) => sources.length > 0),
        switchMap((sources) =>
          this.dialog
            .open<RadarRunCreateDialog, RadarRunCreateDialogData, RadarRun>(RadarRunCreateDialog, {
              width: '520px',
              maxWidth: '95vw',
              data: { sources, runs: this.runs() },
            })
            .afterClosed()
        ),
        filter((run): run is RadarRun => !!run),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((run) => {
        this.toast.success(`Run started for ${run.source.displayName}`);
        this.loadRuns();
      });
  }

  // ── Cancel ────────────────────────────────────────────────────────
  onCancel(run: RadarRun): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Cancel run',
          message: `Stop the run for ${run.source.displayName}? Posts it already saved stay in the Feed. A capture already started on Apify still finishes there and is billed.`,
          confirmLabel: 'Cancel run',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap(() => this.busyRunId.set(run.id)),
        switchMap(() => this.radarService.cancelRun(run.id).pipe(finalize(() => this.busyRunId.set(null)))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.toast.success('Run cancelled');
        this.loadRuns();
      });
  }

  // ── Upload into a Manual run ──────────────────────────────────────
  onFileSelected(run: RadarRun, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset so picking the same file again after a fix still fires `change`.
    input.value = '';
    if (!file) return;

    this.busyRunId.set(run.id);
    this.radarService.uploadCapture(run.source.id, file, run.id).subscribe({
      next: (r) => {
        this.busyRunId.set(null);
        const summary = `${r.created} created, ${r.updated} updated, ${r.failed} failed`;
        if (r.failed) this.toast.warning(`Uploaded: ${summary}`);
        else this.toast.success(`Uploaded: ${summary}`);
        this.loadRuns();
      },
      error: () => this.busyRunId.set(null),
    });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private loadRuns(): void {
    this.loadError.set(false);
    this.radarService.listRuns().subscribe({
      next: (runs) => this.applyRuns(runs),
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private applyRuns(runs: RadarRun[]): void {
    this.runs.set(runs);
    this.loading.set(false);
    this.syncPolling();
  }

  /** Polls only while a run is active; a finished list, or leaving the page, stops it. */
  private syncPolling(): void {
    if (!this.activeCount()) {
      this.pollSub?.unsubscribe();
      this.pollSub = undefined;
      return;
    }
    if (this.pollSub) return;
    this.pollSub = interval(RUN_POLL_MS)
      .pipe(
        // A failed poll skips one beat instead of ending the interval.
        switchMap(() => this.radarService.listRuns(true).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((runs) => this.applyRuns(runs));
  }
}
