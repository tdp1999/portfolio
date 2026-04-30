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
import { MatSortModule, Sort } from '@angular/material/sort';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  type FilterOption,
  FilterSearchComponent,
  FilterSelectComponent,
  ProgressBarService,
  RelativeTimeComponent,
  SkeletonTableComponent,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@portfolio/console/shared/util';
import { ExperienceService } from '../experience.service';
import { AdminExperience } from '../experience.types';
import { DateRangePipe } from '@portfolio/shared/ui/pipes';
import { EnumLabelPipe } from '@portfolio/console/shared/ui';
import { EMPLOYMENT_TYPE_LABELS, LOCATION_TYPE_LABELS } from '@portfolio/shared/enum-labels';

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
    MatSortModule,
    SkeletonTableComponent,
    RelativeTimeComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    DateRangePipe,
    EnumLabelPipe,
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
  private readonly progress = inject(ProgressBarService);

  readonly employmentTypeLabels = EMPLOYMENT_TYPE_LABELS;
  readonly locationTypeLabels = LOCATION_TYPE_LABELS;

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = [
    'company',
    'position',
    'employmentType',
    'locationType',
    'dateRange',
    'updatedAt',
    'actions',
  ];
  readonly experiences = signal<AdminExperience[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly search = signal('');
  readonly employmentType = signal('');
  readonly showDeleted = signal(false);
  readonly sortBy = signal('updatedAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

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

  onShowDeletedChange(value: boolean): void {
    this.showDeleted.set(value);
    this.resetAndLoad();
  }

  onSortChange(sort: Sort): void {
    this.sortBy.set(sort.active || 'updatedAt');
    this.sortDir.set((sort.direction as 'asc' | 'desc') || 'desc');
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadExperiences();
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
          this.loadExperiences({ silent: true });
        },
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
          this.loadExperiences({ silent: true });
        },
      });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadExperiences();
  }

  private loadExperiences(opts: { silent?: boolean } = {}): void {
    this.experienceService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        employmentType: this.employmentType() || undefined,
        includeDeleted: this.showDeleted() || undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
      })
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (res) => {
          this.experiences.set(res.data);
          this.total.set(res.total);
        },
      });
  }
}
