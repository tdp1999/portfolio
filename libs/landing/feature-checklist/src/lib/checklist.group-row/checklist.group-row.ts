import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { Icon, Tooltip } from '@portfolio/landing/shared/ui';
import type { ChecklistGroup, ChecklistRef } from '@portfolio/shared/types';

import { ChecklistInline } from '../checklist.inline/checklist.inline';
import { ChecklistRowEditor } from '../checklist.row-editor/checklist.row-editor';
import { ChecklistTaskRow } from '../checklist.task-row/checklist.task-row';
import type { ChecklistDensity, ChecklistRowAction, ChecklistRowField } from '../checklist.types';
import { tasksProgress } from '../checklist.util';

/**
 * A group: a title with its own child count (no checkbox), then its children indented behind a
 * guide line, so a child reads as part of the group without a glyph. Children move and count with
 * it. Its own actions (note; edit and delete in edit mode) sit at the end of the title line, and its
 * children's actions pass through `action` with the child's id.
 */
@Component({
  selector: 'landing-checklist-group-row',
  imports: [Icon, Tooltip, ChecklistInline, ChecklistRowEditor, ChecklistTaskRow],
  templateUrl: './checklist.group-row.html',
  styleUrl: './checklist.group-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistGroupRow {
  readonly group = input.required<ChecklistGroup>();
  readonly role = input<string | null>(null);
  readonly density = input<ChecklistDensity>('comfortable');
  readonly activeRef = input<ChecklistRef | null>(null);
  /** The page's edit mode: offer edit text and delete, on the group and its children. */
  readonly editable = input(false);
  /** A template, not a run: no count and no actions, here or on the children. */
  readonly viewOnly = input(false);

  readonly action = output<ChecklistRowAction>();
  readonly openRef = output<ChecklistRef>();

  protected readonly editing = signal<ChecklistRowField | null>(null);

  protected readonly progress = computed(() => tasksProgress(this.group().children));
  /** The group's name for assistive tech: its text without markdown markers. */
  protected readonly label = computed(() => this.group().text.replace(/\*\*|`/g, ''));

  protected saveText(text: string): void {
    this.editing.set(null);
    if (text !== this.group().text) this.action.emit({ kind: 'text', id: this.group().id, text });
  }

  protected saveNote(note: string): void {
    this.editing.set(null);
    if (note !== this.group().note) this.action.emit({ kind: 'note', id: this.group().id, note });
  }

  protected remove(): void {
    this.action.emit({ kind: 'remove', id: this.group().id });
  }
}
