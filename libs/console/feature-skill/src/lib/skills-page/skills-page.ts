import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  EnumLabelPipe,
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
import { SKILL_CATEGORY_LABELS } from '@portfolio/shared/enum-labels';
import { SkillService } from '../skill.service';
import { AdminSkill } from '../skill.types';

@Component({
  selector: 'console-skills-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
    MatChipsModule,
    SkeletonTableComponent,
    RelativeTimeComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    EnumLabelPipe,
    RouterLink,
  ],
  templateUrl: './skills-page.html',
  styleUrl: './skills-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkillsPageComponent implements OnInit {
  private readonly skillService = inject(SkillService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly progress = inject(ProgressBarService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['name', 'category', 'parent', 'isLibrary', 'displayOrder', 'updatedAt', 'actions'];
  readonly skills = signal<AdminSkill[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly search = signal('');
  readonly category = signal('');
  readonly showDeleted = signal(false);
  readonly sortBy = signal('updatedAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly skillCategoryLabels = SKILL_CATEGORY_LABELS;

  readonly categoryOptions: FilterOption[] = [
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'TOOLS', label: 'Tools' },
    { value: 'ADDITIONAL', label: 'Additional' },
  ];

  readonly parentMap = computed(() => new Map(this.skills().map((s) => [s.id, s.name])));

  ngOnInit(): void {
    this.loadSkills();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onCategoryChange(value: string): void {
    this.category.set(value);
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
    this.loadSkills();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadSkills();
  }

  confirmDelete(skill: AdminSkill): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Skill',
        message: `Are you sure you want to delete "${skill.name}"?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.deleteSkill(skill.id);
    });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadSkills();
  }

  private loadSkills(opts: { silent?: boolean } = {}): void {
    this.skillService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        category: this.category() || undefined,
        includeDeleted: this.showDeleted() || undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
      })
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (res) => {
          this.skills.set(res.data);
          this.total.set(res.total);
        },
        error: () => this.toast.error('Failed to load skills'),
      });
  }

  private deleteSkill(id: string): void {
    this.skillService.delete(id).subscribe({
      next: () => {
        this.toast.success('Skill deleted successfully');
        this.loadSkills({ silent: true });
      },
      error: () => {
        // Error toast handled by global error interceptor
      },
    });
  }
}
