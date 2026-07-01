import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  type ElementRef,
  OnInit,
  type Signal,
  computed,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  type HasUnsavedChanges,
  ProgressBarService,
  QuickLook,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { finalize, firstValueFrom, forkJoin, of, switchMap } from 'rxjs';
import { SkillService } from '../skill.service';
import { SkillDetailCard } from '../skill.detail-card/skill.detail-card';
import { AdminSkill, ReorderSkillItem, SKILL_TIER_OPTIONS, SkillTier } from '../skill.types';

interface TierGroup {
  tier: SkillTier;
  label: string;
  items: AdminSkill[];
}

@Component({
  selector: 'console-skill-reorder',
  standalone: true,
  imports: [RouterLink, DragDropModule, MatButtonModule, MatIconModule, QuickLook, SkillDetailCard],
  templateUrl: './skill.reorder.html',
  styleUrl: './skill.reorder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SkillReorder implements OnInit, HasUnsavedChanges {
  private readonly skillService = inject(SkillService);
  private readonly toast = inject(ToastService);
  private readonly progress = inject(ProgressBarService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);

  // baseline = last persisted state; groups = working copy the user edits. Save
  // commits groups → baseline; Discard resets groups ← baseline.
  private readonly baseline = signal<TierGroup[]>([]);
  readonly groups = signal<TierGroup[]>([]);

  readonly dirty = computed(() => this.signature(this.groups()) !== this.signature(this.baseline()));

  private readonly parentNames = signal<Map<string, string>>(new Map());

  // Card elements in template order (tier 0 items, then tier 1, …) for roving
  // arrow-key focus across the grid.
  private readonly cardEls = viewChildren<ElementRef<HTMLElement>>('cardEl');

  // --- Preview (QuickLook) state ---
  readonly previewOpen = signal(false);
  readonly previewLoading = signal(false);
  readonly previewSkill = signal<AdminSkill | null>(null);
  readonly previewParent = signal<AdminSkill | null>(null);
  readonly previewChildren = signal<AdminSkill[]>([]);
  private readonly previewId = signal<string | null>(null);

  // Flat order across all tiers drives prev/next navigation in the preview.
  private readonly flatItems = computed(() => this.groups().flatMap((g) => g.items));
  private readonly previewIndex = computed(() => {
    const id = this.previewId();
    return id ? this.flatItems().findIndex((s) => s.id === id) : -1;
  });
  readonly hasPrev = computed(() => this.previewIndex() > 0);
  readonly hasNext = computed(() => {
    const i = this.previewIndex();
    return i >= 0 && i < this.flatItems().length - 1;
  });

  ngOnInit(): void {
    this.load();
  }

  // --- HasUnsavedChanges (canDeactivate guard) ---
  hasUnsavedChanges(): Signal<boolean> {
    return this.dirty;
  }

  onSaveAndContinue(): Promise<boolean> {
    return firstValueFrom(this.persist())
      .then(() => {
        this.commitBaseline();
        return true;
      })
      .catch(() => false);
  }

  parentName(id: string | null): string {
    return id ? (this.parentNames().get(id) ?? '') : '';
  }

  drop(event: CdkDragDrop<AdminSkill[]>): void {
    const sourceTier = event.previousContainer.id as SkillTier;
    const targetTier = event.container.id as SkillTier;
    if (sourceTier === targetTier && event.previousIndex === event.currentIndex) return;

    const groups = this.groups().map((g) => ({ ...g, items: [...g.items] }));
    const source = groups.find((g) => g.tier === sourceTier);
    const target = groups.find((g) => g.tier === targetTier);
    if (!source || !target) return;

    if (source === target) {
      moveItemInArray(target.items, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(source.items, target.items, event.previousIndex, event.currentIndex);
    }

    // Re-stamp displayOrder (0-based per tier) and tier on every touched group.
    this.reindex(source);
    this.reindex(target);
    this.groups.set(groups);
    // The preview's prev/next index is relative to the list order we just changed.
    this.previewOpen.set(false);
  }

  save(): void {
    if (!this.dirty() || this.saving()) return;
    this.persist()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.commitBaseline();
          this.toast.success('Skill order saved');
        },
        error: () => this.toast.error('Failed to save skill order'),
      });
  }

  discard(): void {
    if (this.saving()) return;
    // Close any open preview: its prev/next index is relative to the live list,
    // which is about to change out from under it.
    this.previewOpen.set(false);
    this.groups.set(this.cloneGroups(this.baseline()));
  }

  // --- Card keyboard navigation ---
  // Arrow keys move focus between cards (up/down within a tier, left/right across
  // tiers); Space/Enter opens the preview for the focused card.
  onCardKeydown(event: KeyboardEvent, tier: number, row: number, skill: AdminSkill): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveVertical(tier, row, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveVertical(tier, row, -1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveHorizontal(tier, row, 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.moveHorizontal(tier, row, -1);
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        // Don't let this same keypress reach QuickLook's document listener, which
        // would read the just-opened state and immediately close it.
        event.stopPropagation();
        this.openPreview(skill);
        break;
    }
  }

  private moveVertical(tier: number, row: number, delta: number): void {
    const items = this.groups()[tier]?.items ?? [];
    const next = row + delta;
    if (next >= 0 && next < items.length) this.focusCard(tier, next);
  }

  private moveHorizontal(tier: number, row: number, delta: number): void {
    const groups = this.groups();
    for (let t = tier + delta; t >= 0 && t < groups.length; t += delta) {
      const len = groups[t].items.length;
      if (len > 0) {
        this.focusCard(t, Math.min(row, len - 1));
        return;
      }
    }
  }

  private focusCard(tier: number, row: number): void {
    const groups = this.groups();
    let flat = row;
    for (let i = 0; i < tier; i++) flat += groups[i].items.length;
    this.cardEls()[flat]?.nativeElement.focus();
  }

  // --- Preview ---
  openPreview(skill: AdminSkill): void {
    this.loadPreview(skill.id);
    this.previewOpen.set(true);
  }

  previewPrev(): void {
    const i = this.previewIndex();
    if (i > 0) this.loadPreview(this.flatItems()[i - 1].id);
  }

  previewNext(): void {
    const i = this.previewIndex();
    if (i >= 0 && i < this.flatItems().length - 1) this.loadPreview(this.flatItems()[i + 1].id);
  }

  private loadPreview(id: string): void {
    this.previewId.set(id);
    this.previewLoading.set(true);
    this.skillService
      .getById(id)
      .pipe(
        switchMap((skill) =>
          forkJoin({
            skill: of(skill),
            children: this.skillService.getChildren(skill.id),
            parent: skill.parentSkillId ? this.skillService.getById(skill.parentSkillId) : of(null),
          })
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ skill, children, parent }) => {
          this.previewSkill.set(skill);
          this.previewChildren.set(children);
          this.previewParent.set(parent);
          this.previewLoading.set(false);
        },
        error: () => {
          this.previewLoading.set(false);
          this.toast.error('Failed to load skill');
        },
      });
  }

  // --- Internals ---
  private persist() {
    this.saving.set(true);
    const payload: ReorderSkillItem[] = this.groups().flatMap((g) =>
      g.items.map((s) => ({ id: s.id, displayOrder: s.displayOrder, tier: s.tier }))
    );
    return this.skillService.reorder(payload).pipe(finalize(() => this.saving.set(false)));
  }

  private commitBaseline(): void {
    this.baseline.set(this.cloneGroups(this.groups()));
  }

  private reindex(group: TierGroup): void {
    group.items = group.items.map((s, index) => ({ ...s, displayOrder: index, tier: group.tier }));
  }

  private cloneGroups(groups: TierGroup[]): TierGroup[] {
    return groups.map((g) => ({ ...g, items: g.items.map((s) => ({ ...s })) }));
  }

  private signature(groups: TierGroup[]): string {
    return groups.map((g) => `${g.tier}:${g.items.map((i) => i.id).join(',')}`).join('|');
  }

  private load(): void {
    this.skillService
      .listAll()
      .pipe(withListLoading({ loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (skills) => {
          this.parentNames.set(new Map(skills.map((s) => [s.id, s.name])));
          const groups = this.buildGroups(skills);
          this.groups.set(groups);
          this.baseline.set(this.cloneGroups(groups));
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
