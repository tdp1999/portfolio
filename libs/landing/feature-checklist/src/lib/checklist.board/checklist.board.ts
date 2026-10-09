import { CdkDrag, type CdkDragDrop, CdkDragHandle, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';

import { Button, Icon, Tooltip } from '@portfolio/landing/shared/ui';
import type { ChecklistRef, ChecklistRow, ChecklistRunBody, ChecklistSectionedContent } from '@portfolio/shared/types';

import { CHECKLIST_LOOKUP_SLUG } from '../checklist.constants';
import { ChecklistConfirmDialog } from '../checklist.confirm-dialog/checklist.confirm-dialog';
import { ChecklistGroupRow } from '../checklist.group-row/checklist.group-row';
import { ChecklistPhaseHeader } from '../checklist.phase-header/checklist.phase-header';
import { ChecklistProgress } from '../checklist.progress/checklist.progress';
import { ChecklistRefPanel } from '../checklist.ref-panel/checklist.ref-panel';
import { ChecklistRoleFilter } from '../checklist.role-filter/checklist.role-filter';
import { ChecklistRowEditor } from '../checklist.row-editor/checklist.row-editor';
import { ChecklistTaskRow } from '../checklist.task-row/checklist.task-row';
import type { ChecklistConfirm, ChecklistRowAction } from '../checklist.types';
import {
  bodyProgress,
  CHECKLIST_ROLES,
  findRow,
  phaseProgress,
  roleTaskCounts,
  rowLabel,
  withMovedRow,
  withNewTask,
  withoutRow,
  withPhaseTasksState,
  withRowNote,
  withRowText,
  withShiftedRow,
  withTaskState,
} from '../checklist.util';

/**
 * A run worked on one page, in the Compact layout (task 432): the run as one wide column in the
 * middle, phases that fold, Do and Check as columns, a role filter that dims. A ref chip opens its
 * section beside the run on a wide frame (the run keeps its left edge and narrows from the right)
 * or as a popup on a narrower one.
 *
 * Working a run (tick, skip, notes) is always on and goes out through `body` at once. Changing its
 * structure (drag, edit text, add, delete) waits for edit mode, which works on a draft: every phase
 * opens, and no structure change leaves the board until Save; Cancel drops them. Work done while
 * editing still goes out at once. Saving `body` is the
 * page's job. The DDL showcase drives the same component with a local body. `viewOnly` shows a
 * template the same way, with nothing to tick or change.
 */
@Component({
  selector: 'landing-checklist-board',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    CdkDropListGroup,
    Button,
    Icon,
    Tooltip,
    ChecklistConfirmDialog,
    ChecklistGroupRow,
    ChecklistPhaseHeader,
    ChecklistProgress,
    ChecklistRefPanel,
    ChecklistRoleFilter,
    ChecklistRowEditor,
    ChecklistTaskRow,
  ],
  templateUrl: './checklist.board.html',
  styleUrl: './checklist.board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Escape closes an open ref, while typing too (Escape-to-close is the hotkey guard's exception).
  host: {
    '(document:keydown.escape)': 'onEscape($event)',
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class ChecklistBoard {
  private static nextId = 0;
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  /** Prefix for the board's element ids, so two boards on one page (the DDL) never share one. */
  protected readonly uid = `cl-${ChecklistBoard.nextId++}`;
  private readonly injector = inject(Injector);

  readonly body = model.required<ChecklistRunBody>();
  readonly heading = input.required<string>();
  /** The lookup table, for `tra X`; null until loaded. */
  readonly lookup = input<ChecklistSectionedContent | null>(null);
  /** The run's project profile, for `📁 §N`; null until loaded. */
  readonly project = input<ChecklistSectionedContent | null>(null);
  readonly projectSlug = input('');
  /** Nothing can be changed (the page stopped saving): the run stays readable. */
  readonly locked = input(false);
  /** A template, not a run: no progress, no ticks, notes or edit mode; reading, folding and refs only. */
  readonly viewOnly = input(false);

  protected readonly roles = CHECKLIST_ROLES;
  protected readonly role = signal<string | null>(null);
  /** Closed until a ref chip opens it. */
  protected readonly activeRef = signal<ChecklistRef | null>(null);
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());
  /** Edit mode's working copy; null outside edit mode. */
  protected readonly draft = signal<ChecklistRunBody | null>(null);
  protected readonly editing = computed(() => this.draft() !== null);
  /** The draft's structure changed: Save has something to send, Cancel something to drop. */
  protected readonly dirty = signal(false);
  /** What the board shows: the draft while editing, the run otherwise. */
  protected readonly view = computed(() => this.draft() ?? this.body());
  /** The phase whose "Add task" editor is open. */
  protected readonly addingTo = signal<string | null>(null);
  protected readonly confirm = signal<ChecklistConfirm | null>(null);

  protected readonly total = computed(() => bodyProgress(this.view()));
  protected readonly roleCounts = computed(() => roleTaskCounts(this.view(), this.roles));
  protected readonly phases = computed(() =>
    this.view().phases.map((phase) => {
      const tasks = phase.rows.flatMap((row) => (row.kind === 'task' ? [row] : row.children));
      return {
        phase,
        progress: phaseProgress(phase),
        // Edit mode opens every phase, so a drag can land anywhere.
        collapsed: !this.editing() && this.collapsed().has(phase.id),
        // A phase's check all / uncheck all are greyed when they would move nothing.
        todo: tasks.filter((task) => task.state === 'todo').length,
        done: tasks.filter((task) => task.state === 'done').length,
        rows: phase.rows.map((row) => ({ row, label: rowLabel(row) })),
      };
    })
  );
  /** Every phase folded: the run toolbar's expand/collapse-all icon flips on it. */
  protected readonly allCollapsed = computed(() => this.collapsed().size === this.view().phases.length);
  protected readonly panel = computed(() => {
    const ref = this.activeRef();
    if (!ref) return null;
    const lookup = ref.kind === 'lookup';
    const doc = lookup ? this.lookup() : this.project();
    return {
      ref,
      section: doc?.sections.find((s) => s.key === ref.key) ?? null,
      source: lookup
        ? `Lookup table · ${CHECKLIST_LOOKUP_SLUG}`
        : this.projectSlug()
          ? `Project profile · ${this.projectSlug()}`
          : 'Project profile',
      file: lookup ? `${CHECKLIST_LOOKUP_SLUG}.md` : this.projectSlug() ? `projects/${this.projectSlug()}.md` : '',
      // A template has no project yet: its § refs point at whichever project a run picks.
      emptyMessage:
        !lookup && !this.projectSlug() ? `Section ${ref.key} comes from the project profile a run picks.` : '',
    };
  });

  constructor() {
    // Locked means the page stopped saving (a conflict); a reload brings the server's run. A draft
    // built on the old one must not outlive that, or Save would write the old structure back.
    effect(() => {
      if (this.locked()) untracked(() => this.stopEditing());
    });
  }

  protected onRowAction(action: ChecklistRowAction): void {
    switch (action.kind) {
      case 'state':
        return this.work((body) => withTaskState(body, action.id, action.state));
      case 'text':
        return this.change((body) => withRowText(body, action.id, action.text));
      case 'note':
        return this.work((body) => withRowNote(body, action.id, action.note));
      case 'remove':
        return this.askRemove(action.id);
    }
  }

  /** A group goes with its children, so it asks first (CHK-005); so does a task, as nothing undoes it. */
  private askRemove(rowId: string): void {
    const row = findRow(this.view(), rowId);
    if (!row) return;
    const name = rowLabel(row);
    this.confirm.set(
      row.kind === 'group'
        ? {
            heading: 'Delete this group?',
            message: `“${name}” and its ${row.children.length} tasks leave this run. The template stays as it is.`,
            confirmLabel: 'Delete group',
            run: () => this.change((body) => withoutRow(body, rowId)),
          }
        : {
            heading: 'Delete this row?',
            message: `“${name}” leaves this run. The template stays as it is.`,
            confirmLabel: 'Delete row',
            run: () => this.change((body) => withoutRow(body, rowId)),
          }
    );
  }

  protected checkPhase(phaseId: string, name: string, count: number): void {
    this.confirm.set({
      heading: `Check ${count} open ${count === 1 ? 'task' : 'tasks'}?`,
      message: `Every open task in ${name} becomes done. Skipped tasks stay skipped.`,
      confirmLabel: 'Check all',
      run: () => this.work((body) => withPhaseTasksState(body, phaseId, 'todo', 'done')),
    });
  }

  protected uncheckPhase(phaseId: string, name: string, count: number): void {
    this.confirm.set({
      heading: `Uncheck ${count} done ${count === 1 ? 'task' : 'tasks'}?`,
      message: `Every done task in ${name} goes back to open. Skipped tasks stay skipped.`,
      confirmLabel: 'Uncheck all',
      run: () => this.work((body) => withPhaseTasksState(body, phaseId, 'done', 'todo')),
    });
  }

  protected onConfirmed(): void {
    this.confirm()?.run();
    this.confirm.set(null);
  }

  protected addTask(phaseId: string, text: string): void {
    this.change((body) => withNewTask(body, phaseId, crypto.randomUUID(), text));
    this.addingTo.set(null);
  }

  protected drop(event: CdkDragDrop<string>): void {
    const from = { phaseId: event.previousContainer.data, index: event.previousIndex };
    const to = { phaseId: event.container.data, index: event.currentIndex };
    if (from.phaseId === to.phaseId && from.index === to.index) return;
    this.change((body) => withMovedRow(body, from, to));
  }

  /** The grip's keyboard: arrow up / down move the row one step (across a phase edge too). */
  protected onGripKey(event: KeyboardEvent, row: ChecklistRow): void {
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    this.change((body) => withShiftedRow(body, row.id, delta));
    // A move across phases re-creates the row; keep the focus on its grip so the next press works.
    afterNextRender(() => this.host.querySelector<HTMLElement>(`[data-grip="${row.id}"]`)?.focus(), {
      injector: this.injector,
    });
  }

  /** A structure change: into the draft in edit mode, straight to the run otherwise. */
  private change(edit: (body: ChecklistRunBody) => ChecklistRunBody): void {
    if (!this.draft()) return this.body.update(edit);
    this.draft.update((draft) => draft && edit(draft));
    this.dirty.set(true);
  }

  /** Work (tick, skip, note) is never held back: it goes to the run, and into the draft so Save keeps it. */
  private work(edit: (body: ChecklistRunBody) => ChecklistRunBody): void {
    this.body.update(edit);
    this.draft.update((draft) => draft && edit(draft));
  }

  protected startEditing(): void {
    this.draft.set(this.body());
    this.dirty.set(false);
    this.addingTo.set(null);
  }

  /** Save: the draft becomes the run (one change for the page to save), then edit mode closes. */
  protected saveEditing(): void {
    const draft = this.draft();
    if (draft && this.dirty()) this.body.set(draft);
    this.stopEditing();
  }

  /** Cancel: the draft is dropped and the run is as it was before edit mode. */
  protected stopEditing(): void {
    this.draft.set(null);
    this.dirty.set(false);
    this.addingTo.set(null);
  }

  protected toggleAll(): void {
    this.collapsed.set(this.allCollapsed() ? new Set() : new Set(this.view().phases.map((p) => p.id)));
  }

  /** Leaving with a draft not saved: the browser asks first. */
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) event.preventDefault();
  }

  protected toggleCollapsed(id: string): void {
    this.collapsed.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected closeRef(): void {
    this.activeRef.set(null);
  }

  /** Topmost layer first: an open ref takes the Escape, so a DDL stage around the board stays expanded. */
  protected onEscape(event: Event): void {
    if (!this.activeRef()) return;
    event.stopPropagation();
    this.closeRef();
  }

  /** The popup's backdrop is the aside itself; a click on the card inside does not close it. */
  protected onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeRef();
  }

  /** The same ref twice closes the panel. */
  protected toggleRef(ref: ChecklistRef): void {
    const open = this.activeRef();
    if (open && open.kind === ref.kind && open.key === ref.key) this.closeRef();
    else this.activeRef.set(ref);
  }
}
