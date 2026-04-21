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
import { ProjectService } from '../project.service';
import { AdminProject, SkillOption } from '../project.types';
import { DateRangePipe, TranslatablePipe } from '@portfolio/shared/ui-pipes';

@Component({
  selector: 'console-project-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    DateRangePipe,
    TranslatablePipe,
  ],
  templateUrl: './project-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly project = signal<AdminProject | null>(null);
  readonly loading = signal(false);
  private readonly skillsCache = signal<SkillOption[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
      this.projectService.listSkills().subscribe({
        next: (skills) => this.skillsCache.set(skills),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  openEditDialog(): void {
    const p = this.project();
    if (!p) return;
    this.router.navigate(['/projects', p.id, 'edit']);
  }

  confirmDelete(): void {
    const p = this.project();
    if (!p) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${p.title}"? It will be moved to trash.`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.projectService.delete(p.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Project deleted');
          this.goBack();
        },
        error: () => this.toast.error('Failed to delete project'),
      });
  }

  private loadProject(id: string): void {
    this.loading.set(true);
    this.projectService.getById(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load project');
        this.loading.set(false);
        this.goBack();
      },
    });
  }
}
