import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  EnumLabelPipe,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { SKILL_CATEGORY_LABELS } from '@portfolio/shared/enum-labels';
import { filter, forkJoin, of, switchMap } from 'rxjs';
import { SkillService } from '../skill.service';
import { AdminSkill } from '../skill.types';

@Component({
  selector: 'console-skill-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    EnumLabelPipe,
  ],
  templateUrl: './skill-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkillDetailComponent implements OnInit {
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

  readonly skillCategoryLabels = SKILL_CATEGORY_LABELS;

  readonly hasChildren = computed(() => this.children().length > 0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
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
