import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FilterBar,
  type FilterOption,
  FilterSearch,
  FilterSelect,
  EnumLabelPipe,
  Paginator,
  type PaginatorChange,
  RelativeTime,
  SkeletonTable,
  ToastService,
} from '@portfolio/console/shared/ui';
import { RadarCommentsChipPipe } from '../radar-comments-chip.pipe';
import { RadarScoreTonePipe } from '../radar-score-tone.pipe';
import type { RadarContentType, RadarFeedStatus, RadarProviderTag } from '@portfolio/shared/types';
import { RadarSourceDialog } from '../radar-source.dialog/radar-source.dialog';
import { FEED_PAGE_SIZE, FEED_PAGE_SIZES, MAX_CLAIM_ATTEMPTS } from '../radar.constants';
import { parseFeedQuery, toFeedQuery, toFeedRequest } from '../radar-feed.util';
import { isRunActive } from '../radar-run.util';
import {
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_OPTIONS,
  FEED_STATUS_LABELS,
  MIN_SCORE_OPTIONS,
  PROVIDER_LABELS,
  PROVIDER_OPTIONS,
} from '../radar.data';
import { RadarService } from '../radar.service';
import { RadarFeedItem, RadarFeedSortKey, RadarFeedState, RadarQueueStats } from '../radar.types';

@Component({
  selector: 'console-radar-item-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    FilterBar,
    FilterSearch,
    FilterSelect,
    EnumLabelPipe,
    Paginator,
    RadarScoreTonePipe,
    RadarCommentsChipPipe,
    RelativeTime,
    SkeletonTable,
  ],
  templateUrl: './radar-item.list.html',
  styleUrl: './radar-item.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarItemList implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly items = signal<RadarFeedItem[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(FEED_PAGE_SIZE);
  protected readonly search = signal('');
  protected readonly providerTag = signal('');
  protected readonly contentType = signal('');
  protected readonly minScore = signal('');
  protected readonly includePromo = signal(false);
  protected readonly status = signal('');
  protected readonly sortBy = signal<RadarFeedSortKey>('publishedAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly stats = signal<RadarQueueStats | null>(null);
  protected readonly requeueing = signal(false);
  protected readonly activeRuns = signal(0);

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly activeFilters = computed(() => {
    const filters: { key: string; label: string }[] = [];
    const s = this.search();
    if (s) filters.push({ key: 'search', label: `Search: ${s}` });
    const p = this.providerTag();
    if (p) filters.push({ key: 'provider', label: `Provider: ${this.providerLabel(p)}` });
    const c = this.contentType();
    if (c) filters.push({ key: 'type', label: `Type: ${this.contentTypeLabel(c)}` });
    const m = this.minScore();
    if (m) filters.push({ key: 'score', label: `Score ${m}+` });
    const st = this.status();
    if (st) filters.push({ key: 'status', label: `Status: ${FEED_STATUS_LABELS[st as RadarFeedStatus]}` });
    if (this.includePromo()) filters.push({ key: 'promo', label: 'Promo shown' });
    return filters;
  });

  /** Every queue bucket with its count from the stats call; counts are queue-wide, not narrowed by the other filters. */
  protected readonly statusOptions = computed<FilterOption[]>(() => {
    const s = this.stats();
    return (Object.entries(FEED_STATUS_LABELS) as [RadarFeedStatus, string][]).map(([value, label]) => ({
      value,
      label: s ? `${label} (${s[value]})` : label,
    }));
  });

  /** Rides along to Detail so its prev/next and Back follow this exact view. */
  protected readonly feedQuery = computed(() => toFeedQuery(this.feedState()));

  private readonly feedState = computed<RadarFeedState>(() => ({
    search: this.search(),
    providerTag: this.providerTag(),
    contentType: this.contentType(),
    minScore: this.minScore(),
    includePromo: this.includePromo(),
    status: this.status(),
    sortBy: this.sortBy(),
    sortDir: this.sortDir(),
    pageIndex: this.pageIndex(),
    pageSize: this.pageSize(),
  }));

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly pageSizeOptions = FEED_PAGE_SIZES;
  protected readonly maxClaimAttempts = MAX_CLAIM_ATTEMPTS;
  private itemsSub?: Subscription;
  protected readonly providerOptions = PROVIDER_OPTIONS;
  protected readonly providerLabels = PROVIDER_LABELS;
  protected readonly contentTypeLabels = CONTENT_TYPE_LABELS;
  protected readonly contentTypeOptions = CONTENT_TYPE_OPTIONS;
  protected readonly minScoreOptions = MIN_SCORE_OPTIONS;
  protected readonly displayedColumns = [
    'score',
    'summary',
    'type',
    'providers',
    'status',
    'comments',
    'source',
    'publishedAt',
  ];

  ngOnInit(): void {
    const state = parseFeedQuery(this.route.snapshot.queryParams);
    this.search.set(state.search);
    this.providerTag.set(state.providerTag);
    this.contentType.set(state.contentType);
    this.minScore.set(state.minScore);
    this.includePromo.set(state.includePromo);
    this.status.set(state.status);
    this.sortBy.set(state.sortBy);
    this.sortDir.set(state.sortDir);
    this.pageIndex.set(state.pageIndex);
    this.pageSize.set(state.pageSize);
    this.loadItems();
    this.loadStats();
    this.loadActiveRuns();
  }

  // ── Filters ───────────────────────────────────────────────────────
  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onProviderChange(value: string): void {
    this.providerTag.set(value);
    this.resetAndLoad();
  }

  onContentTypeChange(value: string): void {
    this.contentType.set(value);
    this.resetAndLoad();
  }

  onMinScoreChange(value: string): void {
    this.minScore.set(value);
    this.resetAndLoad();
  }

  onStatusChange(value: string): void {
    this.status.set(value);
    this.resetAndLoad();
  }

  onPromoChange(checked: boolean): void {
    this.includePromo.set(checked);
    this.resetAndLoad();
  }

  onRemoveFilter(key: string): void {
    switch (key) {
      case 'search':
        this.search.set('');
        break;
      case 'provider':
        this.providerTag.set('');
        break;
      case 'type':
        this.contentType.set('');
        break;
      case 'score':
        this.minScore.set('');
        break;
      case 'status':
        this.status.set('');
        break;
      case 'promo':
        this.includePromo.set(false);
        break;
    }
    this.resetAndLoad();
  }

  onClearFilters(): void {
    this.search.set('');
    this.providerTag.set('');
    this.contentType.set('');
    this.minScore.set('');
    this.includePromo.set(false);
    this.status.set('');
    this.resetAndLoad();
  }

  /** Clearing a sort falls back to the default: newest first. */
  onSortChange(sort: Sort): void {
    this.sortBy.set(sort.direction ? (sort.active as RadarFeedSortKey) : 'publishedAt');
    this.sortDir.set(sort.direction || 'desc');
    this.resetAndLoad();
  }

  onOpenItem(item: RadarFeedItem): void {
    this.router.navigate(['/radar/items', item.id], { queryParams: this.feedQuery() });
  }

  onRetry(): void {
    this.loadItems();
  }

  /** The new page starts at its first row, so the list scrolls back to the top. */
  onPage({ pageIndex, pageSize }: PaginatorChange): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
    this.loadItems();
  }

  // ── Label helpers (filter chips) ──────────────────────────────────
  private providerLabel(tag: string): string {
    return PROVIDER_LABELS[tag as RadarProviderTag] ?? tag;
  }

  private contentTypeLabel(type: string): string {
    return CONTENT_TYPE_LABELS[type as RadarContentType] ?? type;
  }

  // ── Queue ─────────────────────────────────────────────────────────
  onRequeueStuck(): void {
    this.requeueing.set(true);
    this.radarService.requeueStuck().subscribe({
      next: ({ requeued }) => {
        this.requeueing.set(false);
        this.toast.success(`${requeued} stuck item(s) are back in the queue`);
        this.loadStats();
      },
      error: () => this.requeueing.set(false),
    });
  }

  // ── Sources ───────────────────────────────────────────────────────
  /** Reloads on every close: an upload or a source toggle inside the dialog changes the Feed and the counts. */
  onOpenSources(): void {
    this.dialog
      .open(RadarSourceDialog, { width: '720px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(() => {
        this.loadItems();
        this.loadStats();
        this.loadActiveRuns();
      });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.loadItems();
  }

  private loadItems(): void {
    this.syncQueryParams();
    this.loading.set(true);
    this.loadError.set(false);
    // A filter changed again before the last page came back: only the newest request may land.
    this.itemsSub?.unsubscribe();
    this.itemsSub = this.radarService.listItems(toFeedRequest(this.feedState())).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadStats(): void {
    this.radarService.getQueueStats().subscribe((stats) => this.stats.set(stats));
  }

  /** Header badge only: a failed read hides it rather than raising a toast. */
  private loadActiveRuns(): void {
    this.radarService.listRuns(true).subscribe({
      next: (runs) => this.activeRuns.set(runs.filter(isRunActive).length),
      error: () => this.activeRuns.set(0),
    });
  }

  private syncQueryParams(): void {
    this.router.navigate([], { queryParams: this.feedQuery(), replaceUrl: true });
  }
}
