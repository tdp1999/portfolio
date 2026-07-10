import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  SpinnerOverlay,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, switchMap } from 'rxjs';
import { ProjectService } from '../project.service';
import { AdminProject, SkillOption } from '../project.types';
import { DateRangePipe, TranslatablePipe } from '@portfolio/shared/ui';
import { RteRenderHtml } from '@portfolio/shared/features/rte-renderer';

@Component({
  selector: 'console-project-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    SpinnerOverlay,
    DateRangePipe,
    TranslatablePipe,
    RteRenderHtml,
  ],
  templateUrl: './project.detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProjectDetail implements OnInit {
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

  private goBack(): void {
    this.router.navigate(['/projects']);
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
        this.loading.set(false);
        this.goBack();
      },
    });
  }
}
