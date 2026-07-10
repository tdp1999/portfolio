import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  SpinnerOverlay,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, forkJoin, of, switchMap } from 'rxjs';
import { SkillService } from '../skill.service';
import { SkillDetailCard } from '../skill.detail-card/skill.detail-card';
import { AdminSkill } from '../skill.types';

@Component({
  selector: 'console-skill-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, SpinnerOverlay, SkillDetailCard],
  templateUrl: './skill.detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkillDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly skillService = inject(SkillService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly skill = signal<AdminSkill | null>(null);
  readonly children = signal<AdminSkill[]>([]);
  readonly parent = signal<AdminSkill | null>(null);
  readonly loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  goToSkill(id: string): void {
    this.router.navigate(['/skills', id]).then(() => {
      // Same-route param change does not re-run ngOnInit; reload explicitly.
      this.load(id);
    });
  }

  confirmDelete(): void {
    const s = this.skill();
    if (!s) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Skill',
          message: `Are you sure you want to delete "${s.name}"?`,
          confirmLabel: 'Delete',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.skillService.delete(s.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Skill deleted');
          this.router.navigate(['/skills']);
        },
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.skillService
      .getById(id)
      .pipe(
        switchMap((skill) =>
          forkJoin({
            skill: of(skill),
            children: this.skillService.getChildren(skill.id),
            parent: skill.parentSkillId ? this.skillService.getById(skill.parentSkillId) : of(null),
          })
        )
      )
      .subscribe({
        next: ({ skill, children, parent }) => {
          this.skill.set(skill);
          this.children.set(children);
          this.parent.set(parent);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/skills']);
        },
      });
  }
}
