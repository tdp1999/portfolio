import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  FilterBarComponent,
  FilterSearchComponent,
  FilterSelectComponent,
  type FilterOption,
  SpinnerOverlayComponent,
  ConfirmDialogComponent,
  type ConfirmDialogData,
  ToastService,
} from '@portfolio/console/shared/ui';
import { ProjectService } from '../project.service';
import { AdminProject, SkillOption } from '../project.types';

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'TRASH', label: 'Trash' },
];

@Component({
  selector: 'console-projects-page',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    SpinnerOverlayComponent,
  ],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProjectsPageComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['thumbnail', 'title', 'status', 'featured', 'startDate', 'actions'];

  readonly projects = signal<AdminProject[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly search = signal('');
  readonly status = signal('');
  readonly statusOptions = STATUS_OPTIONS;

  readonly isTrashTab = computed(() => this.status() === 'TRASH');

  private skillsCache: SkillOption[] = [];

  ngOnInit(): void {
    this.loadProjects();
    this.projectService.listSkills().subscribe({
      next: (skills) => (this.skillsCache = skills),
    });
  }

  onStatusChange(value: string): void {
    this.status.set(value);
    this.pageIndex.set(0);
    this.loadProjects();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
    this.loadProjects();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProjects();
  }

  goToDetail(project: AdminProject): void {
    this.router.navigate(['/projects', project.id]);
  }

  async openCreateDialog(): Promise<void> {
    const { default: ProjectDialogComponent } = await import('../project-dialog/project-dialog');
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { skills: this.skillsCache },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadProjects();
    });
  }

  async openEditDialog(project: AdminProject): Promise<void> {
    const { default: ProjectDialogComponent } = await import('../project-dialog/project-dialog');
    const dialogRef = this.dialog.open(ProjectDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { project, skills: this.skillsCache },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadProjects();
    });
  }

  async confirmDelete(project: AdminProject): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${project.title}"? It will be moved to trash.`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.projectService.delete(project.id).subscribe({
          next: () => {
            this.toast.success('Project deleted');
            this.loadProjects();
          },
          error: () => this.toast.error('Failed to delete project'),
        });
      }
    });
  }

  restoreProject(project: AdminProject): void {
    this.projectService.restore(project.id).subscribe({
      next: () => {
        this.toast.success('Project restored');
        this.loadProjects();
      },
      error: () => this.toast.error('Failed to restore project'),
    });
  }

  private loadProjects(): void {
    this.loading.set(true);
    const isTrash = this.isTrashTab();
    const statusValue = this.status();
    this.projectService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        status: isTrash ? undefined : statusValue || undefined,
        includeDeleted: isTrash || undefined,
        search: this.search() || undefined,
      })
      .subscribe({
        next: (res) => {
          const data = isTrash ? res.data.filter((p) => p.deletedAt) : res.data;
          this.projects.set(data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load projects');
          this.loading.set(false);
        },
      });
  }
}
