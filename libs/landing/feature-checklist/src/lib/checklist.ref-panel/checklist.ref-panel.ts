import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Icon } from '@portfolio/landing/shared/ui';
import type { ChecklistRef, ChecklistSection } from '@portfolio/shared/types';

import { renderSectionMarkdown } from '../checklist-markdown.util';

/**
 * Read-only side panel for a ref: lookup section B, or section 6 of the run's project profile.
 * Read-only: a footer names the file to edit. Only the content; where it sits (column, popup) is the
 * layout's call.
 */
@Component({
  selector: 'landing-checklist-ref-panel',
  imports: [Icon],
  templateUrl: './checklist.ref-panel.html',
  styleUrl: './checklist.ref-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistRefPanel {
  readonly ref = input.required<ChecklistRef>();
  /** The section, or null when the doc has no section under that key. */
  readonly section = input<ChecklistSection | null>(null);
  /** Where the section comes from, e.g. "Lookup table" or "Project · portfolio". */
  readonly source = input('');
  /** The workflow file the section lives in, e.g. `bang-tra.md`: the panel is read-only, edits go there. */
  readonly file = input('');
  /** Why there is no section, when it is not "the doc has none" (a template has no project yet). */
  readonly emptyMessage = input('');

  readonly closed = output<void>();

  protected readonly html = computed(() => {
    const section = this.section();
    return section ? renderSectionMarkdown(section.markdown) : '';
  });
  /** A section that cannot exist yet (a template's project ref) is not "not found". */
  protected readonly missingTitle = computed(() => (this.emptyMessage() ? 'Set by the run' : 'Section not found'));
  protected readonly empty = computed(() => this.emptyMessage() || `This document has no section ${this.key()}.`);
  protected readonly key = computed(() => (this.ref().kind === 'lookup' ? this.ref().key : `§${this.ref().key}`));
}
