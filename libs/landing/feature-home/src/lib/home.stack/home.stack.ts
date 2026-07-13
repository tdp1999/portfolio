import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chip, Container, Eyebrow, SectionHeader } from '@portfolio/landing/shared/ui';
import type { SkillTierGroup } from '@portfolio/landing/shared/data-access';
import { parseInlineParagraphs } from '@portfolio/landing/shared/util';
import { TIER_PROMINENCE } from './home.stack.data';

@Component({
  selector: 'landing-home-stack',
  standalone: true,
  imports: [Chip, Container, Eyebrow, SectionHeader],
  templateUrl: './home.stack.html',
  styleUrl: './home.stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeStack {
  readonly stackIntro = input<string>('');
  readonly tierGroups = input<readonly SkillTierGroup[]>([]);

  protected readonly paragraphs = computed(() => parseInlineParagraphs(this.stackIntro()));
  protected readonly populatedGroups = computed(() => this.tierGroups().filter((g) => g.members.length > 0));
  protected readonly tierProminence = TIER_PROMINENCE;

  /** Interleave: pair paragraph[i] with tier[i] by position. Counts match in
   *  practice (3 paragraphs ↔ 3 tiers); if they diverge, the longer list keeps
   *  rendering with a null counterpart so the layout degrades, it doesn't break. */
  protected readonly beats = computed(() => {
    const paras = this.paragraphs();
    const groups = this.populatedGroups();
    const length = Math.max(paras.length, groups.length);
    return Array.from({ length }, (_, i) => ({
      paragraph: paras[i] ?? null,
      group: groups[i] ?? null,
    }));
  });
}
