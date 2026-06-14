import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProgressBarService, ToastService, withListLoading } from '@portfolio/console/shared/ui';
import { SkillService } from '../skill.service';
import { AdminSkill, SKILL_TIER_OPTIONS, SkillTier } from '../skill.types';

interface TierGroup {
  tier: SkillTier;
  label: string;
  items: AdminSkill[];
}

@Component({
  selector: 'console-skill-reorder',
  standalone: true,
  imports: [RouterLink, DragDropModule, MatButtonModule, MatIconModule],
  templateUrl: './skill.reorder.html',
  styleUrl: './skill.reorder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkillReorder implements OnInit {
  private readonly skillService = inject(SkillService);
  private readonly toast = inject(ToastService);
  private readonly progress = inject(ProgressBarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly reordering = signal(false);
  readonly groups = signal<TierGroup[]>([]);

  private readonly parentNames = signal<Map<string, string>>(new Map());

  ngOnInit(): void {
    this.load();
  }

  parentName(id: string | null): string {
    return id ? (this.parentNames().get(id) ?? '') : '';
  }

  drop(event: CdkDragDrop<AdminSkill[]>, tier: SkillTier): void {
    if (this.reordering() || event.previousIndex === event.currentIndex) return;

    const groups = this.groups().map((g) => ({ ...g, items: [...g.items] }));
    const group = groups.find((g) => g.tier === tier);
    if (!group) return;

    moveItemInArray(group.items, event.previousIndex, event.currentIndex);
    // displayOrder is now per-tier: index within the tier IS the order.
    group.items = group.items.map((skill, index) => ({ ...skill, displayOrder: index }));

    this.applyReorder(groups, group.items);
  }

  private applyReorder(nextGroups: TierGroup[], changed: AdminSkill[]): void {
    // Optimistic: show the new order immediately; the server persists displayOrder
    // (0-based within the tier) and a successful response is the source of truth on
    // the next load. Roll back on failure.
    const previous = this.groups();
    this.groups.set(nextGroups);
    this.reordering.set(true);

    this.skillService
      .reorder(changed.map((skill) => ({ id: skill.id, displayOrder: skill.displayOrder })))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reordering.set(false);
          this.toast.success('Skill order saved');
        },
        error: () => {
          this.groups.set(previous);
          this.reordering.set(false);
          this.toast.error('Failed to reorder skills');
        },
      });
  }

  private load(): void {
    this.skillService
      .listAll()
      .pipe(withListLoading({ loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (skills) => {
          this.parentNames.set(new Map(skills.map((s) => [s.id, s.name])));
          this.groups.set(this.buildGroups(skills));
        },
      });
  }

  private buildGroups(skills: AdminSkill[]): TierGroup[] {
    // Leaf skills only (umbrellas are excluded from the public Stack) — mirrors
    // the landing groupByTier(): sort by displayOrder then name within each tier.
    const leaves = skills.filter((s) => s.parentSkillId !== null && !s.deletedAt);
    return SKILL_TIER_OPTIONS.map(({ value, label }) => ({
      tier: value,
      label,
      items: leaves
        .filter((s) => s.tier === value)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
    }));
  }
}
