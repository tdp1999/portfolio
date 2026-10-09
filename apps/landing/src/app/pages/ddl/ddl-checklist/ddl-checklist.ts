import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

// DDL renders the real board so the showcase is the run page itself. feature-checklist is lazy-loaded
// at /checklist; this DDL-only page (itself lazy) pulls it in by design, as ddl-about-signatures does.
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  CHECKLIST_ROLES,
  ChecklistBoard,
  ChecklistGroupRow,
  ChecklistRoleFilter,
  type ChecklistRowAction,
  ChecklistTaskRow,
  roleTaskCounts,
  withRowNote,
  withRowText,
  withTaskState,
} from '@portfolio/landing/feature-checklist';
import type { InPageSection } from '@portfolio/landing/shared/ui';
import type { ChecklistTask } from '@portfolio/shared/types';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlStage } from '../ddl-stage/ddl-stage';
import { DDL_CHECKLIST_LOOKUP, DDL_CHECKLIST_PROJECT, DDL_CHECKLIST_RUN } from './ddl-checklist.data';

/**
 * The Owner's checklist run page in the picked layout, Compact (task 432). The stage is the real
 * `landing-checklist-board` the run page (task 434) renders, on a local body instead of a saved run.
 */
@Component({
  selector: 'landing-ddl-checklist',
  imports: [ChecklistBoard, ChecklistGroupRow, ChecklistRoleFilter, ChecklistTaskRow, DdlDocPage, DdlSection, DdlStage],
  templateUrl: './ddl-checklist.html',
  styleUrl: './ddl-checklist.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlChecklist {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'run-page', title: 'Run page', level: 2 },
    { id: 'pieces', title: 'Pieces', level: 2 },
    { id: 'notes', title: 'Notes', level: 2 },
  ];

  protected readonly lookup = DDL_CHECKLIST_LOOKUP;
  protected readonly project = DDL_CHECKLIST_PROJECT;
  protected readonly body = signal(DDL_CHECKLIST_RUN);

  protected readonly roles = CHECKLIST_ROLES;
  protected readonly role = signal<string | null>(null);
  protected readonly roleCounts = computed(() => roleTaskCounts(this.body(), this.roles));

  /** One task in each state, for the Pieces section. */
  protected readonly sampleTasks = computed(() => {
    const tasks = this.body().phases.flatMap((p) => p.rows.flatMap((r) => (r.kind === 'task' ? [r] : r.children)));
    const find = (predicate: (t: ChecklistTask) => boolean) => tasks.find(predicate) ?? tasks[0];
    return {
      todo: find((t) => t.state === 'todo' && t.refs.length > 1),
      done: find((t) => t.state === 'done' && !t.note),
      skipped: find((t) => t.state === 'skipped'),
      noted: find((t) => !!t.note),
    };
  });
  protected readonly sampleGroup = computed(() => {
    for (const phase of this.body().phases) {
      const group = phase.rows.find((r) => r.kind === 'group');
      if (group?.kind === 'group') return group;
    }
    return null;
  });

  /** The pieces share the stage's body, so a tick in either shows in both. Delete is the board's. */
  protected onPieceAction(action: ChecklistRowAction): void {
    if (action.kind === 'state') this.body.update((body) => withTaskState(body, action.id, action.state));
    else if (action.kind === 'text') this.body.update((body) => withRowText(body, action.id, action.text));
    else if (action.kind === 'note') this.body.update((body) => withRowNote(body, action.id, action.note));
  }
}
