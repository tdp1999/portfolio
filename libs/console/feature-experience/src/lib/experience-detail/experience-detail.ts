import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
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
import type { ExperienceDialogData } from '../experience-dialog/experience-dialog';

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Internship',
  SELF_EMPLOYED: 'Self Employed',
};

const LOCATION_TYPE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'Onsite',
};

@Component({
  selector: 'console-experience-detail',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatChipsModule, MatIconModule, MatTooltipModule, SpinnerOverlayComponent],
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadExperience(id);
  }

  goBack(): void {
    this.router.navigate(['/experiences']);
  }

  async openEditDialog(): Promise<void> {
    const exp = this.experience();
    if (!exp) return;
    const { default: ExperienceDialogComponent } = await import('../experience-dialog/experience-dialog');
    const dialogRef = this.dialog.open(ExperienceDialogComponent, {
      width: '720px',
      maxHeight: '90vh',
      data: { experience: exp } satisfies ExperienceDialogData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadExperience(exp.id);
    });
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

  getEmploymentTypeLabel(type: string): string {
    return EMPLOYMENT_TYPE_LABELS[type] ?? type;
  }

  getLocationTypeLabel(type: string): string {
    return LOCATION_TYPE_LABELS[type] ?? type;
  }

  formatDateRange(exp: AdminExperience): string {
    const start = new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!exp.endDate) return `${start} – Present`;
    const end = new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${start} – ${end}`;
  }

  formatLocation(exp: AdminExperience): string {
    const parts = [exp.locationCity, exp.locationCountry].filter(Boolean);
    return parts.join(', ') || '—';
  }

  private loadExperience(id: string): void {
    this.loading.set(true);
    this.experienceService.getById(id).subscribe({
      next: (experience) => {
        this.experience.set(experience);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load experience');
        this.loading.set(false);
        this.goBack();
      },
    });
  }
}
