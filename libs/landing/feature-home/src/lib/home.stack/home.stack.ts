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
}
