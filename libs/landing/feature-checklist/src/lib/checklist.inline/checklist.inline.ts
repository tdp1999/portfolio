import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Icon } from '@portfolio/landing/shared/ui';
import type { ChecklistRef } from '@portfolio/shared/types';

import { inlineSegments } from '../checklist.util';

/**
 * A row's, gate's or note's inline markdown: bold, code, and the refs as small buttons in place
 * (`tra B` opens lookup section B, `§6` opens section 6 of the run's project profile).
 */
@Component({
  selector: 'landing-checklist-inline',
  imports: [Icon],
  templateUrl: './checklist.inline.html',
  styleUrl: './checklist.inline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistInline {
  readonly text = input.required<string>();
  /** The ref whose section the side panel shows, marked as pressed. */
  readonly activeRef = input<ChecklistRef | null>(null);

  readonly openRef = output<ChecklistRef>();

  protected readonly segments = computed(() => inlineSegments(this.text()));
}
