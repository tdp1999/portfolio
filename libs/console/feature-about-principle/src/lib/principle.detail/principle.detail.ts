import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  SpinnerOverlay,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, switchMap } from 'rxjs';
import { AboutPrincipleService } from '../about-principle.service';
import { AdminAboutPrinciple } from '../about-principle.types';

@Component({
  selector: 'console-principle-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, SpinnerOverlay],
  templateUrl: './principle.detail.html',
  styleUrl: './principle.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PrincipleDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly principleService = inject(AboutPrincipleService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly principle = signal<AdminAboutPrinciple | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  confirmDelete(): void {
    const p = this.principle();
    if (!p) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete principle',
          message: `Delete "${p.claim.en}"? This cannot be undone.`,
          confirmLabel: 'Delete',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.principleService.delete(p.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Principle deleted');
          this.router.navigate(['/about/principles']);
        },
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.principleService.getById(id).subscribe({
      next: (p) => {
        this.principle.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/about/principles']);
      },
    });
  }
}
