import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HelpButton, SpinnerOverlay } from '@portfolio/console/shared/ui';
import { forkJoin, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { RadarItemDetailCard } from '../radar-item.detail-card/radar-item.detail-card';
import { locateInPage, parseFeedQuery, toFeedQuery, toFeedRequest } from '../radar-feed.util';
import { RadarService } from '../radar.service';
import { RadarFeedItem, RadarFeedState, RadarItemDetail as RadarItem, RadarNeighbour } from '../radar.types';

/**
 * The full page for one post: its record plus the page chrome. Prev/next walk the Feed in the
 * order it was left: the Feed's filters, sort, tab and page ride along in the query params, so the
 * walk survives a refresh and Back returns to the same view.
 */
@Component({
  selector: 'console-radar-item-detail',
  standalone: true,
  imports: [
    HelpButton,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RadarItemDetailCard,
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

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly feedQuery = computed(() => toFeedQuery(this.feedState()));

  /** Query params of the prev/next links: same view, with the page the neighbour sits on. */
  protected readonly prevQuery = computed(() => this.neighbourQuery(this.prev()));
  protected readonly nextQuery = computed(() => this.neighbourQuery(this.next()));

  // ── Plain state ───────────────────────────────────────────────────
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

  /** A comments fetch ended; prev/next may have moved on since it started. */
  onRefresh(id: string): void {
    if (this.item()?.id === id) this.load(id);
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
