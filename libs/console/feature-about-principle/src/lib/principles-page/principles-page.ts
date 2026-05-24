import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  ProgressBarService,
  RelativeTimeComponent,
  SkeletonTableComponent,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { AboutPrincipleService } from '../about-principle.service';
import { AdminAboutPrinciple } from '../about-principle.types';

@Component({
  selector: 'console-principles-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    SkeletonTableComponent,
    RelativeTimeComponent,
    DecimalPipe,
    RouterLink,
  ],
  templateUrl: './principles-page.html',
  styleUrl: './principles-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PrinciplesPageComponent implements OnInit {
  private readonly principleService = inject(AboutPrincipleService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly progress = inject(ProgressBarService);

  readonly displayedColumns = ['order', 'claim', 'publish', 'updatedAt', 'actions'] as const;
  readonly principles = signal<AdminAboutPrinciple[]>([]);
  readonly loading = signal(false);
  readonly reordering = signal(false);

  readonly isEmpty = computed(() => !this.loading() && this.principles().length === 0);

  ngOnInit(): void {
    this.load();
  }

  openCreate(): void {
    this.router.navigate(['/about/principles', 'new']);
  }

  openEdit(p: AdminAboutPrinciple): void {
    this.router.navigate(['/about/principles', p.id, 'edit']);
  }

  togglePublish(p: AdminAboutPrinciple, isPublished: boolean): void {
    this.principleService
      .update(p.id, { isPublished })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.principles.update((items) => items.map((item) => (item.id === p.id ? { ...item, isPublished } : item)));
          this.toast.success(isPublished ? 'Principle published' : 'Principle unpublished');
        },
      });
  }

  moveUp(index: number): void {
    if (index <= 0 || this.reordering()) return;
    const items = [...this.principles()];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    this.applyReorder(items);
  }

  moveDown(index: number): void {
    const items = [...this.principles()];
    if (index >= items.length - 1 || this.reordering()) return;
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    this.applyReorder(items);
  }

  confirmDelete(p: AdminAboutPrinciple): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete principle',
        message: `Delete "${p.claim.en}"? This cannot be undone.`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.principleService.delete(p.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Principle deleted');
          this.load({ silent: true });
        },
      });
  }

  private applyReorder(nextItems: AdminAboutPrinciple[]): void {
    // Optimistic local swap so the row jumps immediately; the server call
    // re-stamps `order` and a successful response is the source of truth on
    // the next reload. Roll back on failure.
    const previous = this.principles();
    this.principles.set(nextItems.map((item, idx) => ({ ...item, order: idx })));
    this.reordering.set(true);
    this.principleService
      .reorder({ ids: nextItems.map((item) => item.id) })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reordering.set(false);
        },
        error: () => {
          this.principles.set(previous);
          this.reordering.set(false);
          this.toast.error('Failed to reorder principles');
        },
      });
  }

  private load(opts: { silent?: boolean } = {}): void {
    this.principleService
      .list()
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (res) => this.principles.set(res.items),
      });
  }
}
