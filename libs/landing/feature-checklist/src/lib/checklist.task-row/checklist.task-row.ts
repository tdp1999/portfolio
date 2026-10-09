import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Checkbox, Icon, Tooltip } from '@portfolio/landing/shared/ui';
import type { ChecklistRef, ChecklistTask } from '@portfolio/shared/types';

import { ChecklistInline } from '../checklist.inline/checklist.inline';
import { ChecklistRowEditor } from '../checklist.row-editor/checklist.row-editor';
import type { ChecklistDensity, ChecklistRowAction, ChecklistRowField } from '../checklist.types';
import { taskMatchesRole } from '../checklist.util';

/**
 * One task: checkbox, text, who does it and who checks it, its note, and a quiet × that marks it
 * skipped (done without doing it, which still counts as complete, CHK-003). A skipped row keeps its
 * checkbox empty and strikes its text; an undo icon takes the × slot and returns it to todo. Under
 * an active role filter a row that does not involve the role is dimmed, never removed. `compact`
 * lays the roles out as columns beside the text in a wide container; `comfortable` keeps them under it.
 *
 * The note is part of working a run, so its button is always there. Editing the text and deleting
 * the row are structure changes, offered only when `editable` (the page's edit mode) is on.
 * The text is the checkbox's label, so a click on it ticks the row. `viewOnly` (a template) drops
 * the checkbox and every action; the empty check slot keeps the columns where a run has them.
 */
@Component({
  selector: 'landing-checklist-task-row',
  imports: [FormsModule, NgTemplateOutlet, Checkbox, Icon, Tooltip, ChecklistInline, ChecklistRowEditor],
  templateUrl: './checklist.task-row.html',
  styleUrl: './checklist.task-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.task-row--done]': "task().state === 'done'",
    '[class.task-row--skipped]': "task().state === 'skipped'",
    '[class.task-row--dimmed]': 'dimmed()',
    '[class.task-row--child]': 'child()',
    '[class.task-row--compact]': "density() === 'compact'",
    '[class.task-row--editing]': 'editing() !== null',
    '[class.task-row--view]': 'viewOnly()',
  },
})
export class ChecklistTaskRow {
  readonly task = input.required<ChecklistTask>();
  /** A child row of a group (the group draws the indent and guide line). */
  readonly child = input(false);
  /** Active role filter, or null for none. */
  readonly role = input<string | null>(null);
  readonly density = input<ChecklistDensity>('comfortable');
  readonly activeRef = input<ChecklistRef | null>(null);
  /** The page's edit mode: offer edit text and delete. */
  readonly editable = input(false);
  /** A template, not a run: nothing to tick, note or change. */
  readonly viewOnly = input(false);

  readonly action = output<ChecklistRowAction>();
  readonly openRef = output<ChecklistRef>();

  private static nextId = 0;
  private readonly document = inject(DOCUMENT);

  /** Ties the text (a label) to the checkbox; unique per row on the page. */
  protected readonly checkId = `checklist-task-${ChecklistTaskRow.nextId++}`;
  protected readonly editing = signal<ChecklistRowField | null>(null);

  protected readonly checked = computed(() => this.task().state === 'done');
  protected readonly dimmed = computed(() => !taskMatchesRole(this.task(), this.role()));
  /** The checkbox's name: the row text without its markdown markers. */
  protected readonly label = computed(() => this.task().text.replace(/\*\*|`/g, ''));

  protected onCheck(checked: boolean): void {
    this.setState(checked ? 'done' : 'todo');
  }

  /** Selecting part of the text to copy it is not a tick. */
  protected onTextClick(event: MouseEvent): void {
    if (this.document.getSelection()?.toString()) event.preventDefault();
  }

  protected setState(state: ChecklistTask['state']): void {
    this.action.emit({ kind: 'state', id: this.task().id, state });
  }

  protected saveText(text: string): void {
    this.editing.set(null);
    if (text !== this.task().text) this.action.emit({ kind: 'text', id: this.task().id, text });
  }

  protected saveNote(note: string): void {
    this.editing.set(null);
    if (note !== this.task().note) this.action.emit({ kind: 'note', id: this.task().id, note });
  }

  protected remove(): void {
    this.action.emit({ kind: 'remove', id: this.task().id });
  }
}
