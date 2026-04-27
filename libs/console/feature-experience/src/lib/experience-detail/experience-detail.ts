import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
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
import { ExperienceService } from '../experience.service';
import { AdminExperience } from '../experience.types';
import { DateRangePipe } from '@portfolio/shared/ui-pipes';
import { EnumLabelPipe } from '@portfolio/console/shared/ui';
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@portfolio/shared/enum-labels';

@Component({
  selector: 'console-experience-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    DateRangePipe,
    EnumLabelPipe,
  ],
  templateUrl: './experience-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ExperienceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly experienceService = inject(ExperienceService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly experience = signal<AdminExperience | null>(null);
  readonly loading = signal(false);

  readonly employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
  readonly locationTypeLabels = LOCATION_TYPE_LABELS;

  readonly formattedLocation = computed(() => {
    const exp = this.experience();
    if (!exp) return '—';
    const parts = [exp.locationCity, exp.locationCountry].filter(Boolean);
    return parts.join(', ') || '—';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadExperience(id);
  }

  goBack(): void {
    this.router.navigate(['/experiences']);
  }

  openEditDialog(): void {
    const exp = this.experience();
    if (!exp) return;
    this.router.navigate(['/experiences', exp.id, 'edit']);
  }

  confirmDelete(): void {
    const exp = this.experience();
    if (!exp) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Experience',
        message: `Are you sure you want to delete "${exp.companyName} — ${exp.position.en}"?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.experienceService.delete(exp.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Experience deleted');
          this.goBack();
        },
        error: () => this.toast.error('Failed to delete experience'),
      });
  }

  confirmRestore(): void {
    const exp = this.experience();
    if (!exp) return;
    this.experienceService.restore(exp.id).subscribe({
      next: () => {
        this.toast.success('Experience restored');
        this.loadExperience(exp.id);
      },
      error: () => this.toast.error('Failed to restore experience'),
    });
  }

  private loadExperience(id: string): void {
    this.loading.set(true);
    this.experienceService.getById(id).subscribe({
      next: (experience) => {
        this.experience.set(experience);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.goBack();
      },
    });
  }
}
