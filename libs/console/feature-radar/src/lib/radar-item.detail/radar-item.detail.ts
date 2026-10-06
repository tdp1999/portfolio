import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  EnumLabelPipe,
  Property,
  PropertyList,
  QuickLook,
  RecordEmptySections,
  RecordField,
  RecordFold,
  RecordLayout,
  RecordPanel,
  RecordSection,
  SpinnerOverlay,
  ToastService,
} from '@portfolio/console/shared/ui';
import {
  filter,
  finalize,
  forkJoin,
  last,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  take,
  takeWhile,
  tap,
  timer,
} from 'rxjs';
import { RadarCommentsChipPipe } from '../radar-comments-chip.pipe';
import { MarkdownPipe } from '../markdown.pipe';
import { RadarImageViewablePipe } from '../radar-image-viewable.pipe';
import { isViewableImage } from '../radar-item.util';
import { UrlHostPipe } from '../url-host.pipe';
import { COMMENTS_POLL_MAX, COMMENTS_POLL_MS } from '../radar.constants';
import { CONTENT_TYPE_LABELS, PROVIDER_LABELS, WORK_STATUS_LABELS } from '../radar.data';
import { locateInPage, parseFeedQuery, toFeedQuery, toFeedRequest } from '../radar-feed.util';
import { RadarService } from '../radar.service';
import {
  RadarCommentLabel,
  RadarFeedItem,
  RadarFeedState,
  RadarItemDetail as RadarItem,
  RadarItemImage,
  RadarNeighbour,
} from '../radar.types';

/** How each comment label reads in the Comments fold. */
const COMMENT_LABELS: Record<RadarCommentLabel, { text: string; badge: string }> = {
  author: { text: 'Author', badge: 'console-badge console-badge--success' },
  substantive: { text: 'Substantive', badge: 'console-badge console-badge--success' },
  low: { text: 'Filler', badge: 'console-badge console-badge--muted' },
  spam: { text: 'Spam', badge: 'console-badge console-badge--danger' },
};

/**
 * One post and everything the worker wrote about it. Prev/next walk the Feed in the order it was
 * left: the Feed's filters, sort and page ride along in the query params, so the walk survives a
 * refresh and Back returns to the same view.
 */
@Component({
  selector: 'console-radar-item-detail',
  standalone: true,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EnumLabelPipe,
    MarkdownPipe,
    RadarImageViewablePipe,
    UrlHostPipe,
    Property,
    PropertyList,
    QuickLook,
    RecordEmptySections,
    RecordField,
    RecordFold,
    RecordLayout,
    RecordPanel,
    RecordSection,
    SpinnerOverlay,
    RadarCommentsChipPipe,
  ],
  templateUrl: './radar-item.detail.html',
  styleUrl: './radar-item.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarItemDetail implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly item = signal<RadarItem | null>(null);
  protected readonly loading = signal(true);
  /** `not-found` for a 404, `failed` for anything else (network, 5xx). */
  protected readonly loadError = signal<'not-found' | 'failed' | null>(null);
  protected readonly feedState = signal<RadarFeedState>(parseFeedQuery({}));
  protected readonly prev = signal<RadarNeighbour | null>(null);
  protected readonly next = signal<RadarNeighbour | null>(null);
  protected readonly fetchingComments = signal(false);
  /** 1-based place in the Feed and its total; null hides the counter (item not in that view). */
  protected readonly position = signal<{ index: number; total: number } | null>(null);
  /** Image URLs the browser could not load (an expired provider link, a pending copy). */
  protected readonly brokenImages = signal<ReadonlySet<string>>(new Set());
  /** The photos of one gallery (the post's or the shared post's) and the one open in Quick Look. */
  protected readonly lightbox = signal<{ photos: RadarItemImage[]; index: number } | null>(null);

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly feedQuery = computed(() => toFeedQuery(this.feedState()));

  /** The post's own media. A shared post's media renders inside the shared post, not here. */
  protected readonly images = computed(() => this.item()?.images ?? []);

  /** The shared post's permalink already sits next to its text as "Open shared post"; every other link stays. */
  protected readonly links = computed(() => {
    const it = this.item();
    const summaries = it?.enrichment?.linkSummaries ?? [];
    return (it?.links ?? [])
      .filter((l) => l.url !== it?.sharedPost?.permalink)
      .map((l) => ({ ...l, summary: summaries.find((s) => s.url === l.url)?.summary ?? null }));
  });

  /** Stored comments with their label's text and badge resolved once (the comment template is untyped). */
  private readonly commentRows = computed(() =>
    (this.item()?.comments.items ?? []).map((c) => ({ ...c, tag: COMMENT_LABELS[c.label] }))
  );
  /** The author's own comments carry the links and screenshots the post points to; shown in full. */
  protected readonly authorComments = computed(() => this.commentRows().filter((c) => c.isAuthor));
  /** Everyone else, best first as stored; spam and filler stay visible but marked. */
  protected readonly otherComments = computed(() => this.commentRows().filter((c) => !c.isAuthor));
  /** Nothing to show or fetch when Facebook reports no comments and none were ever fetched. */
  protected readonly hasComments = computed(() => {
    const c = this.item()?.comments;
    return !!c && (c.postCount > 0 || c.status !== 'NOT_FETCHED');
  });
  /** The fold's one-line summary: how the kept comments split by label. */
  protected readonly otherCommentsGist = computed(() => {
    const counts = new Map<RadarCommentLabel, number>();
    for (const c of this.otherComments()) counts.set(c.label, (counts.get(c.label) ?? 0) + 1);
    return (['substantive', 'low', 'spam'] as const)
      .filter((l) => counts.has(l))
      .map((l) => `${counts.get(l)} ${COMMENT_LABELS[l].text.toLowerCase()}`)
      .join(', ');
  });

  /** Query params of the prev/next links: same view, with the page the neighbour sits on. */
  protected readonly prevQuery = computed(() => this.neighbourQuery(this.prev()));
  protected readonly nextQuery = computed(() => this.neighbourQuery(this.next()));

  protected readonly providerNames = computed(() =>
    (this.item()?.enrichment?.providerTags ?? []).map((t) => PROVIDER_LABELS[t] ?? t).join(', ')
  );

  protected readonly lightboxPhoto = computed(() => {
    const lb = this.lightbox();
    return lb ? lb.photos[lb.index] : null;
  });

  /** Sections with nothing in them, folded into one line at the end instead of empty headers. */
  protected readonly emptySections = computed(() => {
    const it = this.item();
    const e = it?.enrichment;
    if (!it || !e) return [];
    const empty: string[] = [];
    if (!this.images().length && !e.imageNotes) empty.push('Images');
    if (!this.links().length) empty.push('Links');
    if (!this.hasComments()) empty.push('Comments');
    if (!e.factCheck && !e.commentDigest) empty.push('Fact check');
    return empty;
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly workStatusLabels = WORK_STATUS_LABELS;
  protected readonly contentTypeLabels = CONTENT_TYPE_LABELS;
  protected readonly otherCommentsOpen = signal(false);
  private itemSub?: Subscription;
  private neighbourSub?: Subscription;

  ngOnInit(): void {
    // Prev/next reuse this component, so follow the route instead of reading the snapshot once.
    // The router updates the snapshot (query params included) before `paramMap` emits.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.feedState.set(parseFeedQuery(this.route.snapshot.queryParams));
      this.load(id);
    });
  }

  onRetry(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  /**
   * Billed on Apify (capped per call), so it asks first. Starts the job, then polls until it ends:
   * no request waits on Apify. The poll outlives the page on purpose, so leaving mid-fetch still
   * stores the comments that were paid for.
   */
  onFetchComments(): void {
    const it = this.item();
    if (!it) return;
    this.radarService
      .commentsSettings()
      .pipe(
        switchMap((settings) =>
          this.dialog
            .open(ConfirmDialogComponent, {
              data: {
                title: it.comments.status === 'NOT_FETCHED' ? 'Fetch comments' : 'Fetch comments again',
                message: `Read up to ${settings.itemTopLevelLimit} top comments of this post (${it.comments.postCount} on Facebook) and their replies with Apify. This is billed, at most $${settings.itemMaxChargeUsd}, and replaces the comments stored now.`,
                confirmLabel: 'Fetch',
              } satisfies ConfirmDialogData,
            })
            .afterClosed()
        ),
        filter(Boolean),
        tap(() => this.fetchingComments.set(true)),
        switchMap(() => this.radarService.fetchComments(it.id)),
        switchMap((started) =>
          timer(COMMENTS_POLL_MS, COMMENTS_POLL_MS).pipe(
            take(COMMENTS_POLL_MAX),
            switchMap(() => this.radarService.collectComments(it.id, started.jobRef)),
            takeWhile((r) => r.state === 'running', true),
            last()
          )
        ),
        finalize(() => {
          this.fetchingComments.set(false);
          if (this.item()?.id === it.id) this.load(it.id);
        })
      )
      // An error is toasted by the API layer; finalize still reloads the item to show FAILED.
      .subscribe({
        next: (r) => {
          if (r.state === 'running') this.toast.warning('Comments are still being fetched; reload this page later');
          else if (r.status === 'PARTIAL')
            this.toast.warning(`Fetched ${r.fetchedCount} comments; the cap stopped it early`);
          else this.toast.success(`Fetched ${r.fetchedCount} comments`);
        },
        error: () => undefined,
      });
  }

  onImageError(url: string): void {
    this.brokenImages.update((set) => new Set(set).add(url));
  }

  onOpenImage(gallery: RadarItemImage[], image: RadarItemImage): void {
    const photos = gallery.filter((img) => isViewableImage(img, this.brokenImages()));
    this.lightbox.set({ photos, index: Math.max(0, photos.indexOf(image)) });
  }

  onLightboxOpenChange(open: boolean): void {
    if (!open) this.lightbox.set(null);
  }

  onLightboxStep(delta: -1 | 1): void {
    this.lightbox.update((lb) =>
      lb ? { ...lb, index: Math.min(lb.photos.length - 1, Math.max(0, lb.index + delta)) } : null
    );
  }

  // ── shared helpers ────────────────────────────────────────────────
  private neighbourQuery(n: RadarNeighbour | null): Record<string, string> {
    return n ? toFeedQuery({ ...this.feedState(), pageIndex: n.pageIndex }) : {};
  }

  private load(id: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.loadNeighbours(id);
    // Fast prev/next clicks: drop the older item so it cannot land after the newer one.
    this.itemSub?.unsubscribe();
    this.itemSub = this.radarService.getItem(id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.item.set(null);
        this.loadError.set(err.status === 404 ? 'not-found' : 'failed');
        this.loading.set(false);
      },
    });
  }

  /**
   * Loads the Feed page this item was opened from and picks its neighbours, fetching the adjacent
   * page at a boundary. A failure only hides prev/next: the post itself is what the page is for.
   */
  private loadNeighbours(id: string): void {
    this.neighbourSub?.unsubscribe();
    this.prev.set(null);
    this.next.set(null);
    this.position.set(null);
    const state = this.feedState();
    const pageAt = (pageIndex: number) => this.radarService.listItems(toFeedRequest({ ...state, pageIndex }));
    const at = (item: RadarFeedItem | undefined, pageIndex: number): RadarNeighbour | null =>
      item ? { id: item.id, pageIndex } : null;

    this.neighbourSub = pageAt(state.pageIndex)
      .pipe(
        switchMap((page) => {
          const spot = locateInPage(page, id, state.pageIndex, state.pageSize);
          if (!spot) return of(null);
          const side = (
            n: RadarFeedItem | 'previous-page' | 'next-page' | null,
            offset: -1 | 1
          ): Observable<RadarNeighbour | null> => {
            if (n === null) return of(null);
            if (typeof n !== 'string') return of(at(n, state.pageIndex));
            const pageIndex = state.pageIndex + offset;
            return pageAt(pageIndex).pipe(map((p) => at(offset < 0 ? p.data.at(-1) : p.data[0], pageIndex)));
          };
          return forkJoin({
            prev: side(spot.prev, -1),
            next: side(spot.next, 1),
            position: of({ index: spot.position, total: page.total }),
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (r) => {
          if (!r) return;
          this.prev.set(r.prev);
          this.next.set(r.next);
          this.position.set(r.position);
        },
        error: () => undefined,
      });
  }
}
