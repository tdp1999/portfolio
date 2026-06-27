import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EnumLabelPipe } from '@portfolio/console/shared/ui';
import { SKILL_CATEGORY_LABELS, SKILL_TIER_LABELS } from '@portfolio/shared/enum-labels';
import { AdminSkill } from '../skill.types';

/**
 * Presentational skill detail card. Renders the full metadata of a skill and is
 * reused by both the detail route page and the QuickLook preview. Holds no data
 * fetching or routing of its own: parent/children clicks emit `select` so the
 * host decides whether to navigate (detail page) or swap the preview (QuickLook).
 */
@Component({
  selector: 'console-skill-detail-card',
  standalone: true,
  imports: [DatePipe, MatChipsModule, MatIconModule, MatTooltipModule, EnumLabelPipe],
  templateUrl: './skill.detail-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillDetailCard {
  readonly skill = input.required<AdminSkill>();
  readonly parent = input<AdminSkill | null>(null);
  readonly children = input<AdminSkill[]>([]);

  /** Emits a skill id when a parent or child chip is activated. */
  readonly select = output<string>();

  readonly skillCategoryLabels = SKILL_CATEGORY_LABELS;
  readonly skillTierLabels = SKILL_TIER_LABELS;

  readonly hasChildren = computed(() => this.children().length > 0);
}
