import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  SpinnerOverlay,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, switchMap } from 'rxjs';
import { AboutFailureService } from '../about-failure.service';
import { AdminAboutFailure } from '../about-failure.types';

@Component({
  selector: 'console-failure-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, SpinnerOverlay],
  templateUrl: './failure.detail.html',
  styleUrl: './failure.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FailureDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly failureService = inject(AboutFailureService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly failure = signal<AdminAboutFailure | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  confirmDelete(): void {
    const f = this.failure();
    if (!f) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete failure',
          message: `Delete the failure from ${f.year} ("${f.context.en}")? This cannot be undone.`,
          confirmLabel: 'Delete',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.failureService.delete(f.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Failure deleted');
          this.router.navigate(['/about/failures']);
        },
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.failureService.getById(id).subscribe({
      next: (f) => {
        this.failure.set(f);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/about/failures']);
      },
    });
  }
}
