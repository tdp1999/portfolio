import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  RelativeTime,
  SkeletonTable,
  ToastService,
} from '@portfolio/console/shared/ui';
import type { RadarContentType, RadarProviderTag } from '@portfolio/shared/types';
import { RadarSourceDialog } from '../radar-source.dialog/radar-source.dialog';
import { FEED_PAGE_SIZE, MAX_CLAIM_ATTEMPTS } from '../radar.constants';
import { parseFeedQuery, toFeedQuery, toFeedRequest } from '../radar-feed.util';
import {
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_OPTIONS,
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
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    FilterBar,
    FilterSearch,
    FilterSelect,
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

  // ── Queries ───────────────────────────────────────────────────────
  private readonly paginator = viewChild.required(MatPaginator);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly items = signal<RadarFeedItem[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly pageIndex = signal(0);
  protected readonly search = signal('');
  protected readonly providerTag = signal('');
  protected readonly contentType = signal('');
  protected readonly minScore = signal('');
  protected readonly includePromo = signal(false);
  protected readonly sortBy = signal<RadarFeedSortKey>('publishedAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly stats = signal<RadarQueueStats | null>(null);
  protected readonly requeueing = signal(false);

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
    if (this.includePromo()) filters.push({ key: 'promo', label: 'Promo shown' });
    return filters;
  });

  /** Rides along to Detail so its prev/next and Back follow this exact view. */
  protected readonly feedQuery = computed(() => toFeedQuery(this.feedState()));

  private readonly feedState = computed<RadarFeedState>(() => ({
    search: this.search(),
    providerTag: this.providerTag(),
    contentType: this.contentType(),
    minScore: this.minScore(),
    includePromo: this.includePromo(),
    sortBy: this.sortBy(),
    sortDir: this.sortDir(),
    pageIndex: this.pageIndex(),
  }));

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly pageSize = FEED_PAGE_SIZE;
  protected readonly maxClaimAttempts = MAX_CLAIM_ATTEMPTS;
  private itemsSub?: Subscription;
  protected readonly providerOptions = PROVIDER_OPTIONS;
  protected readonly contentTypeOptions = CONTENT_TYPE_OPTIONS;
  protected readonly minScoreOptions = MIN_SCORE_OPTIONS;
  protected readonly displayedColumns = ['score', 'summary', 'type', 'providers', 'status', 'source', 'publishedAt'];

  ngOnInit(): void {
    const state = parseFeedQuery(this.route.snapshot.queryParams);
    this.search.set(state.search);
    this.providerTag.set(state.providerTag);
    this.contentType.set(state.contentType);
    this.minScore.set(state.minScore);
    this.includePromo.set(state.includePromo);
    this.sortBy.set(state.sortBy);
    this.sortDir.set(state.sortDir);
    this.pageIndex.set(state.pageIndex);
    this.loadItems();
    this.loadStats();
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

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.loadItems();
  }

  // ── Row helpers ───────────────────────────────────────────────────
  protected providerLabel(tag: string): string {
    return PROVIDER_LABELS[tag as RadarProviderTag] ?? tag;
  }

  protected contentTypeLabel(type: string): string {
    return CONTENT_TYPE_LABELS[type as RadarContentType] ?? type;
  }

  protected scoreTone(score: number): string {
    if (score >= 7) return 'radar-score--high';
    if (score >= 4) return 'radar-score--mid';
    return 'radar-score--low';
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
      });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadItems();
  }

  private loadItems(): void {
    this.syncQueryParams();
    this.loading.set(true);
    this.loadError.set(false);
    // A filter changed again before the last page came back: only the newest request may land.
    this.itemsSub?.unsubscribe();
    this.itemsSub = this.radarService.listItems(toFeedRequest(this.feedState(), this.pageSize)).subscribe({
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

  private syncQueryParams(): void {
    this.router.navigate([], { queryParams: this.feedQuery(), replaceUrl: true });
  }
}
