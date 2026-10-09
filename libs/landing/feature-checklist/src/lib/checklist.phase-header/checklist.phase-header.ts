import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import type { ChecklistPhase, ChecklistRef } from '@portfolio/shared/types';

import { ChecklistInline } from '../checklist.inline/checklist.inline';
import { ChecklistProgress } from '../checklist.progress/checklist.progress';
import type { ChecklistDensity } from '../checklist.types';
import { phaseNumberLabel, phaseProgress } from '../checklist.util';

/**
 * A phase's head: number, name, the real-world role the Owner steps into, the gate line ("Pass
 * when"), and the phase progress. `comfortable` reads as a chapter opening; `compact` is one line.
 * When `foldable`, a click on the title line asks the page to fold or open the phase.
 */
@Component({
  selector: 'landing-checklist-phase-header',
  imports: [ChecklistInline, ChecklistProgress],
  templateUrl: './checklist.phase-header.html',
  styleUrl: './checklist.phase-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.phase-header--compact]': "density() === 'compact'",
    '[class.phase-header--foldable]': 'foldable()',
  },
})
export class ChecklistPhaseHeader {
  readonly phase = input.required<ChecklistPhase>();
  readonly density = input<ChecklistDensity>('comfortable');
  readonly activeRef = input<ChecklistRef | null>(null);
  /** Heading level for the phase name, so the page outline stays correct inside any layout. */
  readonly level = input<2 | 3>(2);
  readonly showGate = input(true);
  /** A template has no progress to show. */
  readonly showProgress = input(true);
  /** The page folds phases (not in edit mode, where every phase stays open). */
  readonly foldable = input(false);

  readonly openRef = output<ChecklistRef>();
  readonly titleToggle = output<void>();

  private readonly document = inject(DOCUMENT);

  protected readonly progress = computed(() => phaseProgress(this.phase()));
  protected readonly number = computed(() => phaseNumberLabel(this.phase()));

  /** The title line, not a ref chip on it, and not the end of a text selection. */
  protected onTitleClick(event: MouseEvent): void {
    if (!this.foldable()) return;
    if ((event.target as Element).closest('button, a')) return;
    if (this.document.getSelection()?.toString()) return;
    this.titleToggle.emit();
  }
}
