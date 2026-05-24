import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ChipBooleanComponent,
  ConfirmDialogComponent,
  type ConfirmDialogData,
  ProgressBarService,
  RelativeTimeComponent,
  SkeletonTableComponent,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { AboutFailureService } from '../about-failure.service';
import { AdminAboutFailure } from '../about-failure.types';

@Component({
  selector: 'console-failures-page',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ChipBooleanComponent,
    SkeletonTableComponent,
    RelativeTimeComponent,
    DecimalPipe,
    RouterLink,
  ],
  templateUrl: './failures-page.html',
  styleUrl: './failures-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FailuresPageComponent implements OnInit {
  private readonly failureService = inject(AboutFailureService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly progress = inject(ProgressBarService);

  readonly displayedColumns = ['order', 'year', 'context', 'publish', 'updatedAt', 'actions'] as const;
  readonly failures = signal<AdminAboutFailure[]>([]);
  readonly loading = signal(false);
  readonly reordering = signal(false);

  readonly isEmpty = computed(() => !this.loading() && this.failures().length === 0);

  ngOnInit(): void {
    this.load();
  }

  openCreate(): void {
    this.router.navigate(['/about/failures', 'new']);
  }

  openEdit(f: AdminAboutFailure): void {
    this.router.navigate(['/about/failures', f.id, 'edit']);
  }

  togglePublish(f: AdminAboutFailure, isPublished: boolean): void {
    this.failureService
      .update(f.id, { isPublished })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.failures.update((items) => items.map((item) => (item.id === f.id ? { ...item, isPublished } : item)));
          this.toast.success(isPublished ? 'Failure published' : 'Failure unpublished');
        },
      });
  }

  moveUp(index: number): void {
    if (index <= 0 || this.reordering()) return;
    const items = [...this.failures()];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    this.applyReorder(items);
  }

  moveDown(index: number): void {
    const items = [...this.failures()];
    if (index >= items.length - 1 || this.reordering()) return;
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    this.applyReorder(items);
  }

  confirmDelete(f: AdminAboutFailure): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete failure',
        message: `Delete the failure from ${f.year} ("${f.context.en}")? This cannot be undone.`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.failureService.delete(f.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Failure deleted');
          this.load({ silent: true });
        },
      });
  }

  private applyReorder(nextItems: AdminAboutFailure[]): void {
    const previous = this.failures();
    this.failures.set(nextItems.map((item, idx) => ({ ...item, order: idx })));
    this.reordering.set(true);
    this.failureService
      .reorder({ ids: nextItems.map((item) => item.id) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reordering.set(false);
        },
        error: () => {
          this.failures.set(previous);
          this.reordering.set(false);
          this.toast.error('Failed to reorder failures');
        },
      });
  }

  private load(opts: { silent?: boolean } = {}): void {
    this.failureService
      .list()
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (res) => this.failures.set(res.items),
      });
  }
}
