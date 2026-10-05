import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Property,
  PropertyList,
  QuickLook,
  RecordEmptySections,
  RecordField,
  RecordLayout,
  RecordPanel,
  RecordSection,
  SpinnerOverlay,
} from '@portfolio/console/shared/ui';
import type { RadarContentType, RadarProviderTag } from '@portfolio/shared/types';
import { forkJoin, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { MarkdownPipe } from '../markdown.pipe';
import { FEED_PAGE_SIZE } from '../radar.constants';
import { CONTENT_TYPE_LABELS, PROVIDER_LABELS, WORK_STATUS_LABELS } from '../radar.data';
import { locateInPage, parseFeedQuery, toFeedQuery, toFeedRequest } from '../radar-feed.util';
import { RadarService } from '../radar.service';
import {
  RadarFeedItem,
  RadarFeedState,
  RadarItemDetail as RadarItem,
  RadarItemImage,
  RadarNeighbour,
} from '../radar.types';

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
    MarkdownPipe,
    Property,
    PropertyList,
    QuickLook,
    RecordEmptySections,
    RecordField,
    RecordLayout,
    RecordPanel,
    RecordSection,
    SpinnerOverlay,
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

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly item = signal<RadarItem | null>(null);
  protected readonly loading = signal(true);
  /** `not-found` for a 404, `failed` for anything else (network, 5xx). */
  protected readonly loadError = signal<'not-found' | 'failed' | null>(null);
  protected readonly feedState = signal<RadarFeedState>(parseFeedQuery({}));
  protected readonly prev = signal<RadarNeighbour | null>(null);
  protected readonly next = signal<RadarNeighbour | null>(null);
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
    return it?.links.filter((l) => l.url !== it.sharedPost?.permalink) ?? [];
  });

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
    if (!e.factCheck && !e.commentDigest) empty.push('Fact check');
    return empty;
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly workStatusLabels = WORK_STATUS_LABELS;
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

  onImageError(url: string): void {
    this.brokenImages.update((set) => new Set(set).add(url));
  }

  onOpenImage(gallery: RadarItemImage[], image: RadarItemImage): void {
    const photos = gallery.filter((img) => this.isViewable(img));
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

  // ── Template helpers ──────────────────────────────────────────────
  /** A photo we can show full size: saved (or not yet attempted) and not failing to load. */
  protected isViewable(img: RadarItemImage): boolean {
    return img.type === 'photo' && img.storageStatus !== 'failed' && !this.brokenImages().has(img.url);
  }

  protected providerList(tags: RadarProviderTag[]): string {
    return tags.map((t) => PROVIDER_LABELS[t] ?? t).join(', ');
  }

  protected contentTypeLabel(type: string): string {
    return CONTENT_TYPE_LABELS[type as RadarContentType] ?? type;
  }

  /** Query params for a neighbour link: same view, with the page the neighbour sits on. */
  protected neighbourQuery(n: RadarNeighbour): Record<string, string> {
    return toFeedQuery({ ...this.feedState(), pageIndex: n.pageIndex });
  }

  protected summaryFor(url: string): string | null {
    return this.item()?.enrichment?.linkSummaries.find((s) => s.url === url)?.summary ?? null;
  }

  protected hostOf(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  // ── shared helpers ────────────────────────────────────────────────
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
    const pageAt = (pageIndex: number) =>
      this.radarService.listItems(toFeedRequest({ ...state, pageIndex }, FEED_PAGE_SIZE));
    const at = (item: RadarFeedItem | undefined, pageIndex: number): RadarNeighbour | null =>
      item ? { id: item.id, pageIndex } : null;

    this.neighbourSub = pageAt(state.pageIndex)
      .pipe(
        switchMap((page) => {
          const spot = locateInPage(page, id, state.pageIndex, FEED_PAGE_SIZE);
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
