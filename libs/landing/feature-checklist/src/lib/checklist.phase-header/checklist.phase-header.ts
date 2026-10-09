import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { ChecklistPhase, ChecklistRef } from '@portfolio/shared/types';

import { ChecklistInline } from '../checklist.inline/checklist.inline';
import { ChecklistProgress } from '../checklist.progress/checklist.progress';
import type { ChecklistDensity } from '../checklist.types';
import { phaseNumberLabel, phaseProgress } from '../checklist.util';

/**
 * A phase's head: number, name, the real-world role the Owner steps into, the gate line ("Pass
 * when"), and the phase progress. `comfortable` reads as a chapter opening; `compact` is one line.
 */
@Component({
  selector: 'landing-checklist-phase-header',
  imports: [ChecklistInline, ChecklistProgress],
  templateUrl: './checklist.phase-header.html',
  styleUrl: './checklist.phase-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.phase-header--compact]': "density() === 'compact'" },
})
export class ChecklistPhaseHeader {
  readonly phase = input.required<ChecklistPhase>();
  readonly density = input<ChecklistDensity>('comfortable');
  readonly activeRef = input<ChecklistRef | null>(null);
  /** Heading level for the phase name, so the page outline stays correct inside any layout. */
  readonly level = input<2 | 3>(2);
  readonly showGate = input(true);

  readonly openRef = output<ChecklistRef>();

  protected readonly progress = computed(() => phaseProgress(this.phase()));
  protected readonly number = computed(() => phaseNumberLabel(this.phase()));
}
