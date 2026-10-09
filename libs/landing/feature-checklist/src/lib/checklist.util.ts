import type {
  ChecklistPhase,
  ChecklistProgress,
  ChecklistRef,
  ChecklistRow,
  ChecklistRowState,
  ChecklistRunBody,
  ChecklistTask,
} from '@portfolio/shared/types';

import type { ChecklistInlineSegment } from './checklist.types';

/**
 * Inline markdown of a row, gate or note, cut into what the template renders: plain text, bold,
 * code, and the refs (`tra B`, `📁 §6`) as their own segments so they become buttons in place.
 * No HTML is produced, so nothing needs sanitizing.
 */
const INLINE_TOKEN =
  /\*\*(.+?)\*\*|`([^`]+)`|📁\s*(§\d+(?:\s*,\s*§\d+)*)|(?<!["\p{L}])(?<!kiểm )tra ([A-Z])(?![\p{L}\d])/gu;

export function inlineSegments(text: string): ChecklistInlineSegment[] {
  const out: ChecklistInlineSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_TOKEN)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ kind: 'text', text: text.slice(last, at) });
    const [, strong, code, sections, lookup] = match;
    if (strong !== undefined) out.push({ kind: 'strong', text: strong });
    else if (code !== undefined) out.push({ kind: 'code', text: code });
    else if (lookup !== undefined)
      out.push({ kind: 'ref', ref: { kind: 'lookup', key: lookup }, label: `tra ${lookup}` });
    else if (sections !== undefined) {
      for (const section of sections.split(',')) {
        const key = section.trim().slice(1);
        out.push({ kind: 'ref', ref: { kind: 'project', key }, label: `§${key}` });
      }
    }
    last = at + match[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

/**
 * The actors the checklists name in "Ai làm" / "Ai kiểm", longest first. "Claude, session mới" is
 * a different actor from "Claude", so it is cut out of a cell before "Claude" is looked for.
 */
export const CHECKLIST_ROLES: readonly string[] = [
  'Owner',
  'Claude',
  'Claude, session mới',
  'Máy',
  'Người đưa vấn đề',
  'Manager',
  'Tester',
  'Người nghiệm thu UAT',
];

const FRESH_CLAUDE = 'Claude, session mới';

function cellNames(cell: string, role: string): boolean {
  const haystack = role === 'Claude' ? cell.split(FRESH_CLAUDE).join('') : cell;
  return new RegExp(`(?<!\\p{L})${role}(?!\\p{L})`, 'u').test(haystack);
}

/** A task matches a role when its doer or its checker names it (CHK: dim, never remove). */
export function taskMatchesRole(task: ChecklistTask, role: string | null): boolean {
  if (!role) return true;
  return cellNames(task.doer, role) || cellNames(task.checker, role);
}

/** The tasks of a row: itself, or a group's children. */
function tasksOf(row: ChecklistRow): ChecklistTask[] {
  return row.kind === 'task' ? [row] : row.children;
}

/** A phase's number as the run page prints it, two digits ("01"), or empty when it has none. */
export function phaseNumberLabel(phase: ChecklistPhase): string {
  return phase.number === null ? '' : String(phase.number).padStart(2, '0');
}

/** Done and skipped both count as complete (CHK-003). */
export function tasksProgress(tasks: readonly ChecklistTask[]): ChecklistProgress {
  return { complete: tasks.filter((t) => t.state !== 'todo').length, total: tasks.length };
}

/** Groups are not counted, their children are. */
export function phaseProgress(phase: ChecklistPhase): ChecklistProgress {
  return tasksProgress(phase.rows.flatMap(tasksOf));
}

export function bodyProgress(body: ChecklistRunBody): ChecklistProgress {
  return body.phases
    .map(phaseProgress)
    .reduce((sum, p) => ({ complete: sum.complete + p.complete, total: sum.total + p.total }), {
      complete: 0,
      total: 0,
    });
}

/** How many tasks each role does or checks, for the role filter's option list. */
export function roleTaskCounts(body: ChecklistRunBody, roles: readonly string[]): ReadonlyMap<string, number> {
  const tasks = body.phases.flatMap((phase) => phase.rows.flatMap(tasksOf));
  return new Map(roles.map((role) => [role, tasks.filter((task) => taskMatchesRole(task, role)).length]));
}

/** A row with `change` applied to its task, or to each child of a group. */
function mapRow(row: ChecklistRow, change: (task: ChecklistTask) => ChecklistTask): ChecklistRow {
  return row.kind === 'task' ? change(row) : { ...row, children: row.children.map(change) };
}

/** A new body with `change` applied to every task of the phases `inPhase` accepts. */
function mapTasks(
  body: ChecklistRunBody,
  change: (task: ChecklistTask) => ChecklistTask,
  inPhase: (phase: ChecklistPhase) => boolean = () => true
): ChecklistRunBody {
  return {
    ...body,
    phases: body.phases.map((phase) =>
      inPhase(phase) ? { ...phase, rows: phase.rows.map((row) => mapRow(row, change)) } : phase
    ),
  };
}

/** A new body with one task changed; every other task object is shared. */
export function updateTask(
  body: ChecklistRunBody,
  taskId: string,
  change: (task: ChecklistTask) => ChecklistTask
): ChecklistRunBody {
  return mapTasks(body, (task) => (task.id === taskId ? change(task) : task));
}

export function withTaskState(body: ChecklistRunBody, taskId: string, state: ChecklistRowState): ChecklistRunBody {
  return updateTask(body, taskId, (task) => ({ ...task, state }));
}

/**
 * A new body with every task of one phase in state `from` moved to `to` (a phase's check all /
 * uncheck all). Tasks in other states, skipped ones included, and other phases are left alone.
 */
export function withPhaseTasksState(
  body: ChecklistRunBody,
  phaseId: string,
  from: ChecklistRowState,
  to: ChecklistRowState
): ChecklistRunBody {
  return mapTasks(
    body,
    (task) => (task.state === from ? { ...task, state: to } : task),
    (phase) => phase.id === phaseId
  );
}

/** The refs a row's text names, in reading order, as the API's parser records them. */
export function refsOf(text: string): ChecklistRef[] {
  return inlineSegments(text).flatMap((segment) => (segment.kind === 'ref' ? [segment.ref] : []));
}

/**
 * A new body with `change` applied to the row `rowId`: a phase's row or a group's child. `null`
 * removes it (a group goes with its children, CHK-005).
 */
function editRow(
  body: ChecklistRunBody,
  rowId: string,
  change: (row: ChecklistRow) => ChecklistRow | null
): ChecklistRunBody {
  const edit = <T extends ChecklistRow>(rows: readonly T[]): T[] =>
    rows.flatMap((row) => {
      if (row.id === rowId) {
        const next = change(row);
        return next ? [next as T] : [];
      }
      return row.kind === 'group' ? [{ ...row, children: edit(row.children) } as T] : [row];
    });
  return { ...body, phases: body.phases.map((phase) => ({ ...phase, rows: edit(phase.rows) })) };
}

/** A row's text, with its refs re-read from the new text. */
export function withRowText(body: ChecklistRunBody, rowId: string, text: string): ChecklistRunBody {
  return editRow(body, rowId, (row) => ({ ...row, text, refs: refsOf(text) }));
}

export function withRowNote(body: ChecklistRunBody, rowId: string, note: string): ChecklistRunBody {
  return editRow(body, rowId, (row) => ({ ...row, note }));
}

export function withoutRow(body: ChecklistRunBody, rowId: string): ChecklistRunBody {
  return editRow(body, rowId, () => null);
}

/** A task the Owner adds: text only, no doer or checker (the template never named one). */
export function withNewTask(body: ChecklistRunBody, phaseId: string, id: string, text: string): ChecklistRunBody {
  const task: ChecklistTask = {
    kind: 'task',
    id,
    text,
    refs: refsOf(text),
    doer: '',
    checker: '',
    state: 'todo',
    note: '',
  };
  return {
    ...body,
    phases: body.phases.map((phase) => (phase.id === phaseId ? { ...phase, rows: [...phase.rows, task] } : phase)),
  };
}

/** A phase's row moved to `toIndex` of the same or another phase (a drop). A group carries its children. */
export function withMovedRow(
  body: ChecklistRunBody,
  from: { phaseId: string; index: number },
  to: { phaseId: string; index: number }
): ChecklistRunBody {
  const source = body.phases.find((phase) => phase.id === from.phaseId);
  const row = source?.rows[from.index];
  if (!row || !body.phases.some((phase) => phase.id === to.phaseId)) return body;
  const phases = body.phases.map((phase) =>
    phase.id === from.phaseId ? { ...phase, rows: phase.rows.filter((_, i) => i !== from.index) } : phase
  );
  return {
    ...body,
    phases: phases.map((phase) => {
      if (phase.id !== to.phaseId) return phase;
      const rows = [...phase.rows];
      rows.splice(Math.max(0, Math.min(to.index, rows.length)), 0, row);
      return { ...phase, rows };
    }),
  };
}

/**
 * A phase's row one step up (-1) or down (+1), the keyboard's way to drag. Past the first or last
 * row it crosses into the neighbouring phase (to that phase's end or start); at the run's ends it stays.
 */
export function withShiftedRow(body: ChecklistRunBody, rowId: string, delta: -1 | 1): ChecklistRunBody {
  const at = body.phases.findIndex((phase) => phase.rows.some((row) => row.id === rowId));
  if (at < 0) return body;
  const phase = body.phases[at];
  const index = phase.rows.findIndex((row) => row.id === rowId);
  const target = index + delta;
  if (target >= 0 && target < phase.rows.length) {
    return withMovedRow(body, { phaseId: phase.id, index }, { phaseId: phase.id, index: target });
  }
  const neighbour = body.phases[at + delta];
  if (!neighbour) return body;
  return withMovedRow(
    body,
    { phaseId: phase.id, index },
    { phaseId: neighbour.id, index: delta < 0 ? neighbour.rows.length : 0 }
  );
}

/** A row by id: a phase's row or a group's child. */
export function findRow(body: ChecklistRunBody, rowId: string): ChecklistRow | undefined {
  for (const phase of body.phases) {
    for (const row of phase.rows) {
      if (row.id === rowId) return row;
      const child = row.kind === 'group' ? row.children.find((task) => task.id === rowId) : undefined;
      if (child) return child;
    }
  }
  return undefined;
}

/** A row's text as a plain label (no markdown markers), for names and confirm messages. */
export function rowLabel(row: ChecklistRow): string {
  return row.text.replace(/\*\*|`/g, '');
}
