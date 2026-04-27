import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
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
import { SkillDialogData } from '../skill-dialog/skill-dialog';
import { AdminSkill, SkillService } from '../skill.service';

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

  private parentMap = new Map<string, string>();

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

  getParentName(parentSkillId: string | null): string {
    if (!parentSkillId) return '—';
    return this.parentMap.get(parentSkillId) ?? '—';
  }

  openCreateDialog(): void {
    import('../skill-dialog/skill-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '640px',
        data: { parentSkills: this.getTopLevelSkills() } satisfies SkillDialogData,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Skill created successfully');
          this.loadSkills({ silent: true });
        }
      });
    });
  }

  openEditDialog(skill: AdminSkill): void {
    import('../skill-dialog/skill-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '640px',
        data: {
          skill,
          parentSkills: this.getTopLevelSkills().filter((s) => s.id !== skill.id),
        } satisfies SkillDialogData,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Skill updated successfully');
          this.loadSkills({ silent: true });
        }
      });
    });
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

  private getTopLevelSkills(): AdminSkill[] {
    return this.skills().filter((s) => !s.parentSkillId);
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
          this.buildParentMap(res.data);
        },
        error: () => this.toast.error('Failed to load skills'),
      });
  }

  private buildParentMap(skills: AdminSkill[]): void {
    this.parentMap.clear();
    for (const skill of skills) {
      this.parentMap.set(skill.id, skill.name);
    }
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
