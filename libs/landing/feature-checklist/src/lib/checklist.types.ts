import type { ChecklistRef, ChecklistRowState, ChecklistRunStatus } from '@portfolio/shared/types';

/** A piece of a row's inline markdown, as `inlineSegments` cuts it. */
export type ChecklistInlineSegment =
  | { kind: 'text'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'ref'; ref: ChecklistRef; label: string };

/** How tightly the run page sets its rows: reading layouts use `comfortable`, dense ones `compact`. */
export type ChecklistDensity = 'comfortable' | 'compact';

/** What the create-run form sends. */
export interface CreateChecklistRunInput {
  name: string;
  templateSlug: string;
  projectSlug: string;
}

/** A rename, a status change, or both. */
export interface UpdateChecklistRunInput {
  name?: string;
  status?: ChecklistRunStatus;
}

/**
 * What a row asks of the page: a task's state, a row's text or note, or its removal. `id` is the
 * row's own (a group child's, not its group's), so a group passes its children's actions through.
 */
export type ChecklistRowAction =
  | { kind: 'state'; id: string; state: ChecklistRowState }
  | { kind: 'text'; id: string; text: string }
  | { kind: 'note'; id: string; note: string }
  | { kind: 'remove'; id: string };

/** Which inline editor a row has open. */
export type ChecklistRowField = 'text' | 'note';

/** A question the board asks before a change it cannot undo; `run` applies the change. */
export interface ChecklistConfirm {
  heading: string;
  message: string;
  confirmLabel: string;
  run: () => void;
}

/** Where the run page's autosave is: everything saved, waiting for a pause, on its way, or stopped. */
export type ChecklistSaveState = 'saved' | 'pending' | 'saving' | 'failed' | 'conflict';
