import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { filter, Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BulkActionBar,
  EnumLabelPipe,
  FilterBar,
  FilterMore,
  type FilterOption,
  FilterSearch,
  FilterSelect,
  HelpButton,
  Paginator,
  type PaginatorChange,
  RelativeTime,
  SegmentedControl,
  SetHasPipe,
  SkeletonTable,
  ToastService,
} from '@portfolio/console/shared/ui';
import { RadarItemReanalyzeDialog } from '../radar-item.reanalyze-dialog/radar-item.reanalyze-dialog';
import { RadarItemProgressCell } from '../radar-item-progress.cell/radar-item-progress.cell';
import { RadarScoreTonePipe } from '../radar-score-tone.pipe';
import { RadarSourceMonogramPipe } from '../radar-source-monogram.pipe';
import type { RadarContentType, RadarFeedStatus, RadarProviderTag } from '@portfolio/shared/types';
import { RadarSourceDialog } from '../radar-source.dialog/radar-source.dialog';
import {
  FEED_PAGE_SIZE,
  FEED_PAGE_SIZES,
  FEED_VIEW_STORAGE_KEY,
  MAX_CLAIM_ATTEMPTS,
  REANALYZE_MAX_IDS,
} from '../radar.constants';
import { parseFeedQuery, parseItemParam, toFeedQuery, toFeedRequest } from '../radar-feed.util';
import { isRunActive } from '../radar-run.util';
import {
  ANALYSIS_DEPTH_HELP,
  ANALYSIS_DEPTH_LABELS,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_OPTIONS,
  FEED_STATUS_LABELS,
  FEED_VIEW_OPTIONS,
  MIN_SCORE_OPTIONS,
  PROVIDER_LABELS,
  PROVIDER_OPTIONS,
  SPLIT_SORT_OPTIONS,
  TRIAGE_TABS,
  PLATFORM_LABELS,
} from '../radar.data';
import { RadarService } from '../radar.service';
import { RadarItemTriageSection } from '../radar-item-triage.section/radar-item-triage.section';
import {
  RadarFeedItem,
  RadarFeedSortKey,
  RadarFeedState,
  RadarFeedView,
  RadarQueueStats,
  RadarReanalyzeDialogData,
  RadarSource,
  RadarTriageDecision,
  RadarTriageStatus,
  ReanalyzeItemsResult,
} from '../radar.types';

@Component({
  selector: 'console-radar-item-list',
  standalone: true,
  imports: [
    BulkActionBar,
    HelpButton,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    EnumLabelPipe,
    FilterBar,
    FilterMore,
    FilterSearch,
    FilterSelect,
    FormsModule,
    NgTemplateOutlet,
    Paginator,
    RadarItemProgressCell,
    RadarScoreTonePipe,
    RadarSourceMonogramPipe,
    RadarItemTriageSection,
    RelativeTime,
    SegmentedControl,
    SetHasPipe,
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
  protected readonly sourceId = signal('');
  protected readonly sources = signal<RadarSource[]>([]);
  protected readonly sortBy = signal<RadarFeedSortKey>('publishedAt');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly stats = signal<RadarQueueStats | null>(null);
  protected readonly requeueing = signal(false);
  protected readonly activeRuns = signal(0);
  protected readonly triage = signal<RadarTriageStatus>('INBOX');
  protected readonly triageCounts = signal<Record<RadarTriageStatus, number> | null>(null);
  protected readonly view = signal<RadarFeedView>('table');
  /** The post open in the Split pane; none means the Split view shows the plain table. */
  protected readonly selectedId = signal<string | null>(null);
  /** A triage change is on its way; decisions wait so two cannot cross. */
  protected readonly deciding = signal(false);
  /** Checkboxes on the table rows, for re-analyzing several posts at once. */
  protected readonly bulkMode = signal(false);
  /** Picked post ids; kept across pages, sorts, filters and tabs until cleared. */
  protected readonly selection = signal<ReadonlySet<string>>(new Set());

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly activeFilters = computed(() => {
    const filters: { key: string; label: string }[] = [];
    const s = this.search();
    if (s) filters.push({ key: 'search', label: `Search: ${s}` });
    const st = this.status();
    if (st) filters.push({ key: 'status', label: `Status: ${FEED_STATUS_LABELS[st as RadarFeedStatus]}` });
    const src = this.sourceId();
    if (src) {
      const name = this.sources().find((x) => x.id === src)?.displayName ?? 'Unknown';
      filters.push({ key: 'source', label: `Source: ${name}` });
    }
    const p = this.providerTag();
    if (p) filters.push({ key: 'provider', label: `Provider: ${this.providerLabel(p)}` });
    const c = this.contentType();
    if (c) filters.push({ key: 'type', label: `Type: ${this.contentTypeLabel(c)}` });
    const m = this.minScore();
    if (m) filters.push({ key: 'score', label: `Score ${m}+` });
    if (this.includePromo()) filters.push({ key: 'promo', label: 'Promo shown' });
    return filters;
  });

  /** How many of the "Filters" panel's filters are set, for its button. */
  protected readonly moreCount = computed(
    () =>
      [this.providerTag(), this.contentType(), this.minScore()].filter(Boolean).length + (this.includePromo() ? 1 : 0)
  );

  protected readonly sourceOptions = computed<FilterOption[]>(() =>
    this.sources().map((x) => ({ value: x.id, label: x.displayName }))
  );

  /** Split view with a post open: compact list plus the post. Otherwise the table. */
  protected readonly paneOpen = computed(() => this.view() === 'split' && !!this.selectedId());

  /** Bulk mode lives in the Table view only; Split keeps the picks but hides the checkboxes. */
  protected readonly showBulk = computed(() => this.bulkMode() && this.view() === 'table');
  protected readonly tableColumns = computed(() =>
    this.showBulk() ? ['select', ...this.displayedColumns] : this.displayedColumns
  );
  protected readonly pageAllSelected = computed(() => {
    const items = this.items();
    const sel = this.selection();
    return items.length > 0 && items.every((it) => sel.has(it.id));
  });
  protected readonly pageSomeSelected = computed(
    () => !this.pageAllSelected() && this.items().some((it) => this.selection().has(it.id))
  );

  /** Every queue bucket with its count from the stats call; counts are queue-wide, not narrowed by the other filters. */
  protected readonly statusOptions = computed<FilterOption[]>(() => {
    const s = this.stats();
    return (Object.entries(FEED_STATUS_LABELS) as [RadarFeedStatus, string][]).map(([value, label]) => ({
      value,
      label: s ? `${label} (${s[value]})` : label,
    }));
  });

  /** The Split view's sort select value, read from the sort key and direction. */
  protected readonly splitSort = computed(
    () => SPLIT_SORT_OPTIONS.find((o) => o.sortBy === this.sortBy() && o.sortDir === this.sortDir())?.value ?? ''
  );

  /** Rides along to Detail so its prev/next and Back follow this exact view. */
  protected readonly feedQuery = computed(() => toFeedQuery(this.feedState()));

  private readonly feedState = computed<RadarFeedState>(() => ({
    search: this.search(),
    providerTag: this.providerTag(),
    contentType: this.contentType(),
    minScore: this.minScore(),
    includePromo: this.includePromo(),
    status: this.status(),
    sourceId: this.sourceId(),
    sortBy: this.sortBy(),
    sortDir: this.sortDir(),
    pageIndex: this.pageIndex(),
    pageSize: this.pageSize(),
    triage: this.triage(),
  }));

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly pageSizeOptions = FEED_PAGE_SIZES;
  protected readonly maxClaimAttempts = MAX_CLAIM_ATTEMPTS;
  private itemsSub?: Subscription;
  protected readonly providerOptions = PROVIDER_OPTIONS;
  protected readonly contentTypeOptions = CONTENT_TYPE_OPTIONS;
  protected readonly minScoreOptions = MIN_SCORE_OPTIONS;
  protected readonly triageTabs = TRIAGE_TABS;
  protected readonly viewOptions = FEED_VIEW_OPTIONS;
  protected readonly splitSortOptions = SPLIT_SORT_OPTIONS;
  protected readonly depthLabels = ANALYSIS_DEPTH_LABELS;
  /** Widened: the mat-table row (`let item`) is untyped. */
  protected readonly platformLabels: Readonly<Record<string, string>> = PLATFORM_LABELS;
  protected readonly depthHelp = ANALYSIS_DEPTH_HELP;
  protected readonly displayedColumns = ['score', 'summary', 'progress', 'status', 'source', 'publishedAt'];

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const state = parseFeedQuery(params);
    this.search.set(state.search);
    this.providerTag.set(state.providerTag);
    this.contentType.set(state.contentType);
    this.minScore.set(state.minScore);
    this.includePromo.set(state.includePromo);
    this.status.set(state.status);
    this.sourceId.set(state.sourceId);
    this.sortBy.set(state.sortBy);
    this.sortDir.set(state.sortDir);
    this.pageIndex.set(state.pageIndex);
    this.pageSize.set(state.pageSize);
    this.triage.set(state.triage);
    this.view.set(this.initialView(params['view']));
    this.selectedId.set(parseItemParam(params['item']));
    this.loadItems();
    this.loadStats();
    this.loadActiveRuns();
    this.loadSources();
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

  onSourceChange(value: string): void {
    this.sourceId.set(value);
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
      case 'source':
        this.sourceId.set('');
        break;
      case 'promo':
        this.includePromo.set(false);
        break;
    }
    this.resetAndLoad();
  }

  onClearFilters(): void {
    this.search.set('');
    this.status.set('');
    this.sourceId.set('');
    this.onClearMoreFilters();
  }

  /** Clears the "Filters" panel's group only; search, status and source stay. */
  onClearMoreFilters(): void {
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

  // ── Triage ────────────────────────────────────────────────────────
  onTriageTab(status: RadarTriageStatus): void {
    if (status === this.triage()) return;
    this.triage.set(status);
    this.selectedId.set(null);
    this.resetAndLoad();
  }

  onViewChange(view: string): void {
    const next: RadarFeedView = view === 'split' ? 'split' : 'table';
    this.view.set(next);
    this.selectedId.set(null);
    try {
      localStorage.setItem(FEED_VIEW_STORAGE_KEY, next);
    } catch {
      // Storage blocked (private window): the choice still holds for this visit through the URL.
    }
    this.syncQueryParams();
  }

  onSplitSort(value: string): void {
    const option = SPLIT_SORT_OPTIONS.find((o) => o.value === value) ?? SPLIT_SORT_OPTIONS[0];
    this.sortBy.set(option.sortBy);
    this.sortDir.set(option.sortDir);
    this.resetAndLoad();
  }

  onSelect(id: string): void {
    this.selectedId.set(id);
    this.syncQueryParams();
  }

  /** X or Escape: the pane closes and the Split view shows the full table again. */
  onClosePane(): void {
    this.selectedId.set(null);
    this.syncQueryParams();
  }

  /**
   * Moves one post to a status. The post keeps its place in the list and stays open, so the
   * decision button turns into its own undo (pressing it again sends the post back to Inbox).
   * It leaves the tab on the next load: a tab, filter or page change.
   */
  onDecide({ id, status }: RadarTriageDecision): void {
    const item = this.items().find((it) => it.id === id);
    if (!item || this.deciding()) return;
    this.deciding.set(true);
    this.radarService.triageItems([id], status).subscribe({
      next: () => {
        this.items.update((items) => items.map((it) => (it.id === id ? { ...it, triageStatus: status } : it)));
        this.triageCounts.update((c) =>
          c ? { ...c, [item.triageStatus]: c[item.triageStatus] - 1, [status]: c[status] + 1 } : c
        );
        this.deciding.set(false);
      },
      error: () => this.deciding.set(false),
    });
  }

  /** The summary is a link for keyboard and middle-click; a plain click in Split opens the pane instead. */
  onSummaryClick(e: MouseEvent, item: RadarFeedItem): void {
    e.stopPropagation();
    if (this.view() !== 'split' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    this.onSelect(item.id);
  }

  /** Table view opens the Detail page; Split view opens the post in the pane beside the list. */
  onOpenItem(item: RadarFeedItem): void {
    if (this.view() === 'split') this.onSelect(item.id);
    else this.router.navigate(['/radar/items', item.id], { queryParams: this.feedQuery() });
  }

  onRetry(): void {
    this.loadItems();
  }

  /** The new page starts at its first row, so the list scrolls back to the top. */
  onPage({ pageIndex, pageSize }: PaginatorChange): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
    this.loadItems({ openFirst: this.paneOpen() });
  }

  // ── Label helpers (filter chips) ──────────────────────────────────
  private providerLabel(tag: string): string {
    return PROVIDER_LABELS[tag as RadarProviderTag] ?? tag;
  }

  private contentTypeLabel(type: string): string {
    return CONTENT_TYPE_LABELS[type as RadarContentType] ?? type;
  }

  // ── Bulk re-analysis ──────────────────────────────────────────────
  /** Turning bulk mode off drops the picks with it. */
  onToggleBulk(): void {
    const on = !this.bulkMode();
    this.bulkMode.set(on);
    if (!on) this.onClearSelection();
  }

  onToggleRow(id: string): void {
    const sel = this.selection();
    if (sel.has(id)) {
      this.selection.set(new Set([...sel].filter((x) => x !== id)));
      return;
    }
    if (this.overCap(sel.size + 1)) return;
    this.selection.set(new Set([...sel, id]));
  }

  /** The header box: picks every post on this page, or unpicks them once all are picked. */
  onTogglePage(): void {
    const sel = new Set(this.selection());
    const ids = this.items().map((it) => it.id);
    if (this.pageAllSelected()) {
      ids.forEach((id) => sel.delete(id));
    } else {
      ids.forEach((id) => sel.add(id));
      if (this.overCap(sel.size)) return;
    }
    this.selection.set(sel);
  }

  onClearSelection(): void {
    this.selection.set(new Set());
  }

  onReanalyzeSelected(): void {
    const ids = [...this.selection()];
    if (!ids.length) return;
    this.dialog
      .open<RadarItemReanalyzeDialog, RadarReanalyzeDialogData, ReanalyzeItemsResult>(RadarItemReanalyzeDialog, {
        data: { ids },
        width: '480px',
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.onClearSelection();
        this.loadItems();
        this.loadStats();
        this.loadActiveRuns();
      });
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
  /** One re-analysis takes at most `REANALYZE_MAX_IDS` posts; a pick past that is refused. */
  private overCap(size: number): boolean {
    if (size <= REANALYZE_MAX_IDS) return false;
    this.toast.warning(`One re-analysis takes at most ${REANALYZE_MAX_IDS} posts.`);
    return true;
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.loadItems();
  }

  /** `openFirst` keeps the pane open on a new page by opening its first post. */
  private loadItems({ openFirst = false } = {}): void {
    this.syncQueryParams();
    this.loading.set(true);
    this.loadError.set(false);
    // A filter changed again before the last page came back: only the newest request may land.
    this.itemsSub?.unsubscribe();
    this.itemsSub = this.radarService.listItems(toFeedRequest(this.feedState())).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.total);
        this.triageCounts.set(res.triageCounts);
        // The URL's post may sit on another page or tab: the pane closes rather than open another post.
        if (openFirst) this.selectedId.set(res.data[0]?.id ?? null);
        else if (!res.data.some((it) => it.id === this.selectedId())) this.selectedId.set(null);
        this.loading.set(false);
        this.syncQueryParams();
      },
      error: () => {
        this.items.set([]);
        this.selectedId.set(null);
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadStats(): void {
    this.radarService.getQueueStats().subscribe((stats) => this.stats.set(stats));
  }

  /** Options for the Source filter; a failed read leaves the select empty, the API toasts. */
  private loadSources(): void {
    this.radarService.listSources().subscribe((sources) => this.sources.set(sources));
  }

  /** Header badge only: a failed read hides it rather than raising a toast. */
  private loadActiveRuns(): void {
    this.radarService.listRuns(true).subscribe({
      next: (runs) => this.activeRuns.set(runs.filter(isRunActive).length),
      error: () => this.activeRuns.set(0),
    });
  }

  /** `?view=` wins, then the last view used in this browser, then the table. */
  private initialView(param: unknown): RadarFeedView {
    if (param === 'split' || param === 'table') return param;
    try {
      return localStorage.getItem(FEED_VIEW_STORAGE_KEY) === 'split' ? 'split' : 'table';
    } catch {
      return 'table';
    }
  }

  /** The Feed state, plus the view and, in Split, the open post. */
  private syncQueryParams(): void {
    const queryParams: Record<string, string> = { ...this.feedQuery() };
    if (this.view() === 'split') {
      queryParams['view'] = 'split';
      const id = this.selectedId();
      if (id) queryParams['item'] = id;
    }
    this.router.navigate([], { queryParams, replaceUrl: true });
  }
}
