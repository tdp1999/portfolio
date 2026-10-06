import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EnumLabelPipe,
  Property,
  PropertyList,
  RecordLayout,
  RecordPanel,
  RecordSection,
  SpinnerOverlay,
} from '@portfolio/console/shared/ui';
import { catchError, EMPTY, Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { MarkdownPipe } from '../markdown.pipe';
import { BRIEF_POLL_MS } from '../radar.constants';
import { BRIEF_STATUS_BADGES, BRIEF_STATUS_LABELS } from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarBriefDetail as RadarBrief } from '../radar.types';

/**
 * One brief: the worker's markdown in the column, what it covers in the rail. Every point in the
 * body links to its post as `/radar/items/<id>`; those links open in the console without a reload.
 */
@Component({
  selector: 'console-radar-brief-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    EnumLabelPipe,
    MarkdownPipe,
    Property,
    PropertyList,
    RecordLayout,
    RecordPanel,
    RecordSection,
    SpinnerOverlay,
  ],
  templateUrl: './radar-brief.detail.html',
  styleUrl: './radar-brief.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarBriefDetail implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly brief = signal<RadarBrief | null>(null);
  protected readonly loading = signal(true);
  /** `not-found` for a 404, `failed` for anything else (network, 5xx). */
  protected readonly loadError = signal<'not-found' | 'failed' | null>(null);

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly written = computed(() => this.brief()?.workStatus === 'DONE');

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly statusLabels = BRIEF_STATUS_LABELS;
  protected readonly statusBadges = BRIEF_STATUS_BADGES;
  private briefSub?: Subscription;
  private pollSub?: Subscription;

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

  /**
   * The body is `[innerHTML]`, so its links are plain anchors that would reload the console. A
   * post link (`/radar/...`) goes through the router; any other link opens in a new tab. A modified
   * click (new tab, new window) keeps the browser's own behaviour.
   */
  onBodyClick(event: MouseEvent): void {
    const anchor = (event.target as Element | null)?.closest('a');
    const href = anchor?.getAttribute('href');
    if (!href || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (href.startsWith('/radar/')) void this.router.navigateByUrl(href);
    else window.open(href, '_blank', 'noopener,noreferrer');
  }

  // ── shared helpers ────────────────────────────────────────────────
  private load(id: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.briefSub?.unsubscribe();
    this.briefSub = this.radarService.getBrief(id).subscribe({
      next: (brief) => {
        this.brief.set(brief);
        this.loading.set(false);
        this.pollUntilWritten(brief);
      },
      error: (err: HttpErrorResponse) => {
        this.brief.set(null);
        this.loadError.set(err.status === 404 ? 'not-found' : 'failed');
        this.loading.set(false);
      },
    });
  }

  /** A waiting brief refreshes until the worker submits it; a failed poll skips one beat. */
  private pollUntilWritten(brief: RadarBrief): void {
    this.pollSub?.unsubscribe();
    if (brief.workStatus === 'DONE') return;
    this.pollSub = timer(BRIEF_POLL_MS, BRIEF_POLL_MS)
      .pipe(
        switchMap(() => this.radarService.getBrief(brief.id, true).pipe(catchError(() => EMPTY))),
        takeWhile((next) => next.workStatus !== 'DONE', true),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((next) => this.brief.set(next));
  }
}
