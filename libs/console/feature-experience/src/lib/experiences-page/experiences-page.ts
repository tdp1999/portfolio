import { ChangeDetectionStrategy, Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  type FilterOption,
  FilterSearchComponent,
  FilterSelectComponent,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import type { ExperienceDialogData } from '../experience-dialog/experience-dialog';
import { ExperienceService } from '../experience.service';
import { AdminExperience } from '../experience.types';

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
  selector: 'console-experiences-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
  ],
  templateUrl: './experiences-page.html',
  styleUrl: './experiences-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ExperiencesPageComponent implements OnInit {
  private readonly experienceService = inject(ExperienceService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['company', 'position', 'employmentType', 'locationType', 'dateRange', 'actions'];
  readonly experiences = signal<AdminExperience[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly search = signal('');
  readonly employmentType = signal('');
  readonly includeDeleted = signal(true);

  readonly employmentTypeOptions: FilterOption[] = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'SELF_EMPLOYED', label: 'Self Employed' },
  ];

  ngOnInit(): void {
    this.loadExperiences();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onEmploymentTypeChange(value: string): void {
    this.employmentType.set(value);
    this.resetAndLoad();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadExperiences();
  }

  getEmploymentTypeLabel(value: string): string {
    return EMPLOYMENT_TYPE_LABELS[value] ?? value;
  }

  getLocationTypeLabel(value: string): string {
    return LOCATION_TYPE_LABELS[value] ?? value;
  }

  formatDateRange(exp: AdminExperience): string {
    const start = this.formatMonth(exp.startDate);
    const end = exp.endDate ? this.formatMonth(exp.endDate) : 'Present';
    return `${start} – ${end}`;
  }

  openCreateDialog(): void {
    import('../experience-dialog/experience-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '720px',
        maxHeight: '90vh',
        data: {} satisfies ExperienceDialogData,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Experience created successfully');
          this.loadExperiences();
        }
      });
    });
  }

  openEditDialog(exp: AdminExperience): void {
    import('../experience-dialog/experience-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '720px',
        maxHeight: '90vh',
        data: { experience: exp } satisfies ExperienceDialogData,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Experience updated successfully');
          this.loadExperiences();
        }
      });
    });
  }

  confirmDelete(exp: AdminExperience): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Experience',
        message: `Are you sure you want to delete "${exp.companyName}"?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.deleteExperience(exp.id);
    });
  }

  confirmRestore(exp: AdminExperience): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Restore Experience',
        message: `Restore "${exp.companyName}"?`,
        confirmLabel: 'Restore',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.restoreExperience(exp.id);
    });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadExperiences();
  }

  private loadExperiences(): void {
    this.loading.set(true);
    this.experienceService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        employmentType: this.employmentType() || undefined,
        includeDeleted: this.includeDeleted(),
      })
      .subscribe({
        next: (res) => {
          this.experiences.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load experiences');
        },
      });
  }

  private deleteExperience(id: string): void {
    this.experienceService.delete(id).subscribe({
      next: () => {
        this.toast.success('Experience deleted');
        this.loadExperiences();
      },
      error: () => {
        this.toast.error('Failed to delete experience');
      },
    });
  }

  private restoreExperience(id: string): void {
    this.experienceService.restore(id).subscribe({
      next: () => {
        this.toast.success('Experience restored');
        this.loadExperiences();
      },
      error: () => {
        this.toast.error('Failed to restore experience');
      },
    });
  }

  private formatMonth(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
