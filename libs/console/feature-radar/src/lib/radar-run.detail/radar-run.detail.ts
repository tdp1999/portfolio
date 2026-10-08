import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EnumLabelPipe,
  HelpButton,
  Money,
  Paginator,
  type PaginatorChange,
  Property,
  PropertyList,
  RecordLayout,
  RecordPanel,
  RecordSection,
  SpinnerOverlay,
} from '@portfolio/console/shared/ui';
import { catchError, EMPTY, Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { RadarScoreTonePipe } from '../radar-score-tone.pipe';
import {
  captureInputRows,
  displayStatus,
  isRunActive,
  itemsDetail,
  runItemsLabel,
  runSourceLabel,
  runStepRows,
} from '../radar-run.util';
import { RUN_POLL_MS } from '../radar.constants';
import {
  ITEM_KIND_LABELS,
  REANALYZE_HELP,
  RUN_AI_FEATURE_LABELS,
  RUN_FLOW_HELP,
  RUN_FLOW_LABELS,
  RUN_STATUS_BADGES,
  RUN_STATUS_LABELS,
  WORK_STATUS_LABELS,
} from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarFeedPage, RadarRunDetail as RadarRunRecord, RadarRunPostRow } from '../radar.types';

/** Posts per page of the run's post list. */
const POSTS_PAGE_SIZE = 20;

/**
 * One run: what it sent to the provider, how long each step took, which posts it could not read,
 * the posts it touched last and, for an Auto run, what each AI feature cost. Polls while the run
 * is still going, like the Runs page.
 */
@Component({
  selector: 'console-radar-run-detail',
  standalone: true,
  imports: [
    HelpButton,
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EnumLabelPipe,
    Money,
    Paginator,
    Property,
    PropertyList,
    RadarScoreTonePipe,
    RecordLayout,
    RecordPanel,
    RecordSection,
    SpinnerOverlay,
  ],
  templateUrl: './radar-run.detail.html',
  styleUrl: './radar-run.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarRunDetail implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly run = signal<RadarRunRecord | null>(null);
  protected readonly loading = signal(true);
  /** `not-found` for a 404, `failed` for anything else (network, 5xx). */
  protected readonly loadError = signal<'not-found' | 'failed' | null>(null);
  protected readonly posts = signal<RadarFeedPage | null>(null);
  protected readonly postsLoading = signal(false);
  protected readonly postsError = signal(false);
  protected readonly postsPageIndex = signal(0);

  // ── Derived ───────────────────────────────────────────────────────
  /** Everything the page shows about the run, precomputed so the template only reads fields. */
  protected readonly view = computed(() => {
    const run = this.run();
    if (!run) return null;
    const spendTotal = run.aiSpend?.reduce((sum, f) => sum + f.costMicroUsd, 0) ?? null;
    return {
      ...run,
      displayStatus: displayStatus(run),
      active: isRunActive(run),
      sourceLabel: runSourceLabel(run),
      itemsLabel: runItemsLabel(run),
      itemsDetail: itemsDetail(run),
      flowHelp: run.kind === 'REANALYZE' ? REANALYZE_HELP : RUN_FLOW_HELP[run.flow],
      captureRows: run.captureInput ? captureInputRows(run.captureInput) : [],
      stepRows: runStepRows(run),
      spendTotal,
      spendRows: (run.aiSpend ?? []).map((f) => ({ ...f, label: RUN_AI_FEATURE_LABELS[f.feature] ?? f.feature })),
    };
  });

  protected readonly postRows = computed<RadarRunPostRow[]>(() =>
    (this.posts()?.data ?? []).map((item) => ({
      id: item.id,
      authorName: item.authorName,
      publishedAt: item.publishedAt,
      isVideo: item.kind === 'REEL' || item.kind === 'VIDEO',
      kindLabel: ITEM_KIND_LABELS[item.kind],
      statusLabel: WORK_STATUS_LABELS[item.workStatus],
      score: item.enrichment?.signalScore ?? null,
    }))
  );

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly flowLabels = RUN_FLOW_LABELS;
  protected readonly statusLabels = RUN_STATUS_LABELS;
  protected readonly statusBadges = RUN_STATUS_BADGES;
  protected readonly postsPageSize = POSTS_PAGE_SIZE;
  private runSub?: Subscription;
  private pollSub?: Subscription;
  private postsSub?: Subscription;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });
  }

  onRetry(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  onPostsPage({ pageIndex }: PaginatorChange): void {
    this.postsPageIndex.set(pageIndex);
    const run = this.run();
    if (run) this.loadPosts(run.id);
  }

  // ── shared helpers ────────────────────────────────────────────────
  private load(id: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.postsPageIndex.set(0);
    this.posts.set(null);
    this.runSub?.unsubscribe();
    this.runSub = this.radarService.getRun(id).subscribe({
      next: (run) => {
        this.run.set(run);
        this.loading.set(false);
        this.loadPosts(run.id);
        this.pollWhileActive(run);
      },
      error: (err: HttpErrorResponse) => {
        this.run.set(null);
        this.loadError.set(err.status === 404 ? 'not-found' : 'failed');
        this.loading.set(false);
      },
    });
  }

  /** Promo posts included: the list answers "what did this run touch", not "what is worth reading". */
  private loadPosts(runId: string): void {
    this.postsLoading.set(true);
    this.postsError.set(false);
    this.postsSub?.unsubscribe();
    this.postsSub = this.radarService
      .listItems({
        page: this.postsPageIndex() + 1,
        limit: POSTS_PAGE_SIZE,
        runId,
        includePromo: true,
        sortBy: 'publishedAt',
        sortDir: 'desc',
      })
      .subscribe({
        next: (page) => {
          this.posts.set(page);
          this.postsLoading.set(false);
        },
        error: () => {
          this.postsError.set(true);
          this.postsLoading.set(false);
        },
      });
  }

  /** An active run refreshes until it ends; a failed poll skips one beat. Posts reload with it. */
  private pollWhileActive(run: RadarRunRecord): void {
    this.pollSub?.unsubscribe();
    if (!isRunActive(run)) return;
    this.pollSub = timer(RUN_POLL_MS, RUN_POLL_MS)
      .pipe(
        switchMap(() => this.radarService.getRun(run.id, true).pipe(catchError(() => EMPTY))),
        takeWhile((next) => isRunActive(next), true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((next) => {
        this.run.set(next);
        this.loadPosts(next.id);
      });
  }
}
