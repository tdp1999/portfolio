import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, switchMap } from 'rxjs';
import { TagService } from '../tag.service';
import { AdminTag } from '../tag.types';

@Component({
  selector: 'console-tag-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, SpinnerOverlayComponent],
  templateUrl: './tag-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TagDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tagService = inject(TagService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tag = signal<AdminTag | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  confirmDelete(): void {
    const t = this.tag();
    if (!t) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Tag',
          message: `Are you sure you want to delete "${t.name}"?`,
          confirmLabel: 'Delete',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.tagService.delete(t.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Tag deleted');
          this.router.navigate(['/tags']);
        },
        error: () => this.toast.error('Failed to delete tag'),
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.tagService.getById(id).subscribe({
      next: (tag) => {
        this.tag.set(tag);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load tag');
        this.loading.set(false);
        this.router.navigate(['/tags']);
      },
    });
  }
}
