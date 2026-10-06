import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { EnumLabelPipe, RelativeTime, SkeletonTable, ToastService } from '@portfolio/console/shared/ui';
import { catchError, EMPTY, filter, finalize, interval, Subscription, switchMap } from 'rxjs';
import { RadarBriefCreateDialog } from '../radar-brief.create.dialog/radar-brief.create.dialog';
import { BRIEF_POLL_MS } from '../radar.constants';
import { BRIEF_STATUS_BADGES, BRIEF_STATUS_LABELS } from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarBrief, RadarBriefCreateDialogData } from '../radar.types';

@Component({
  selector: 'console-radar-brief-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    EnumLabelPipe,
    RelativeTime,
    SkeletonTable,
  ],
  templateUrl: './radar-brief.list.html',
  styleUrl: './radar-brief.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarBriefList implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly briefs = signal<RadarBrief[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly opening = signal(false);

  // ── Derived ───────────────────────────────────────────────────────
  /** Only one brief may wait for the worker at a time, so New brief stays off while one does. */
  protected readonly waiting = computed(() => this.briefs().some((b) => b.workStatus !== 'DONE'));

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly displayedColumns = ['window', 'source', 'status', 'items', 'createdAt'];
  protected readonly statusLabels = BRIEF_STATUS_LABELS;
  protected readonly statusBadges = BRIEF_STATUS_BADGES;
  private pollSub?: Subscription;

  ngOnInit(): void {
    this.loadBriefs();
  }

  onRetry(): void {
    this.loading.set(true);
    this.loadBriefs();
  }

  /** Sources load on open, as on the Runs page: the list can change in the Sources dialog meanwhile. */
  onNewBrief(): void {
    this.opening.set(true);
    this.radarService
      .listSources()
      .pipe(
        finalize(() => this.opening.set(false)),
        switchMap((sources) =>
          this.dialog
            .open<RadarBriefCreateDialog, RadarBriefCreateDialogData, RadarBrief>(RadarBriefCreateDialog, {
              width: '520px',
              maxWidth: '95vw',
              data: { sources },
            })
            .afterClosed()
        ),
        filter((brief): brief is RadarBrief => !!brief),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.toast.success('Brief requested. Run /radar work brief in Claude Code to write it.');
        this.loadBriefs();
      });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private loadBriefs(): void {
    this.loadError.set(false);
    this.radarService.listBriefs().subscribe({
      next: (briefs) => this.applyBriefs(briefs),
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private applyBriefs(briefs: RadarBrief[]): void {
    this.briefs.set(briefs);
    this.loading.set(false);
    this.syncPolling();
  }

  /** Polls only while a brief waits for the worker; once it is written, or the page is left, it stops. */
  private syncPolling(): void {
    if (!this.waiting()) {
      this.pollSub?.unsubscribe();
      this.pollSub = undefined;
      return;
    }
    if (this.pollSub) return;
    this.pollSub = interval(BRIEF_POLL_MS)
      .pipe(
        // A failed poll skips one beat instead of ending the interval.
        switchMap(() => this.radarService.listBriefs(true).pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((briefs) => this.applyBriefs(briefs));
  }
}
