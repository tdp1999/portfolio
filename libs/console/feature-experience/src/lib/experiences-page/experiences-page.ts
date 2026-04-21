import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@portfolio/console/shared/util';
import { ExperienceService } from '../experience.service';
import { AdminExperience } from '../experience.types';
import { DateRangePipe } from '@portfolio/shared/ui-pipes';
import { EmploymentTypeLabelPipe } from '../employment-type-label.pipe';
import { LocationTypeLabelPipe } from '../location-type-label.pipe';

@Component({
  selector: 'console-experiences-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    DateRangePipe,
    EmploymentTypeLabelPipe,
    LocationTypeLabelPipe,
    RouterLink,
  ],
  templateUrl: './experiences-page.html',
  styleUrl: './experiences-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ExperiencesPageComponent implements OnInit {
  private readonly experienceService = inject(ExperienceService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['company', 'position', 'employmentType', 'locationType', 'dateRange', 'actions'];
  readonly experiences = signal<AdminExperience[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
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

  goToDetail(exp: AdminExperience): void {
    this.router.navigate(['/experiences', exp.id]);
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

  openCreateDialog(): void {
    this.router.navigate(['/experiences', 'new']);
  }

  openEditDialog(exp: AdminExperience): void {
    this.router.navigate(['/experiences', exp.id, 'edit']);
  }

  confirmDelete(exp: AdminExperience): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Experience',
        message: `Are you sure you want to delete "${exp.companyName}"?`,
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
          this.loadExperiences();
        },
        error: () => this.toast.error('Failed to delete experience'),
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
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.experienceService.restore(exp.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Experience restored');
          this.loadExperiences();
        },
        error: () => this.toast.error('Failed to restore experience'),
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
}
