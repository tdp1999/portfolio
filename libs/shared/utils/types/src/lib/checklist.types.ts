/**
 * Checklist: the Owner's work checklists, authored as markdown in the workflow folder and
 * worked as runs on the landing site. Shared by the API (parser, run storage) and the landing
 * feature lib (rendering, editing).
 */

/** What a synced markdown file is: a lane checklist, the lookup table, or a project profile. */
export const CHECKLIST_DOC_KINDS = ['TEMPLATE', 'LOOKUP', 'PROJECT'] as const;
export type ChecklistDocKind = (typeof CHECKLIST_DOC_KINDS)[number];

export const CHECKLIST_RUN_STATUSES = ['ACTIVE', 'DONE', 'ARCHIVED'] as const;
export type ChecklistRunStatus = (typeof CHECKLIST_RUN_STATUSES)[number];

/** `skipped` is done without doing it, and counts as complete (CHK-003). */
export const CHECKLIST_ROW_STATES = ['todo', 'done', 'skipped'] as const;
export type ChecklistRowState = (typeof CHECKLIST_ROW_STATES)[number];

/** `tra B` points at lookup section B; `📁 §6` at section 6 of the run's project profile. */
export interface ChecklistRef {
  kind: 'lookup' | 'project';
  key: string;
}

/** A block of markdown prose with the refs found in it. */
export interface ChecklistProse {
  markdown: string;
  refs: ChecklistRef[];
}

export interface ChecklistTask {
  kind: 'task';
  id: string;
  /** Inline markdown. */
  text: string;
  refs: ChecklistRef[];
  /** "Ai làm" cell, as written. Empty for a row the Owner added. */
  doer: string;
  /** "Ai kiểm" cell, as written. */
  checker: string;
  state: ChecklistRowState;
  note: string;
}

/** A bold row without a checkbox; its `↳` rows are its children and move with it (CHK-005). */
export interface ChecklistGroup {
  kind: 'group';
  id: string;
  text: string;
  refs: ChecklistRef[];
  note: string;
  children: ChecklistTask[];
}

export type ChecklistRow = ChecklistTask | ChecklistGroup;

export interface ChecklistPhase {
  id: string;
  /** Phase numbers are not contiguous (lane S runs 1, 5, 6, 7), and lane M starts at 0. */
  number: number | null;
  name: string;
  /** The real-world role after the `|` in the heading. */
  role: string | null;
  /** The "Qua pha khi" line. */
  gate: ChecklistProse | null;
  /** Any other prose inside the phase. */
  note: ChecklistProse | null;
  rows: ChecklistRow[];
}

/** A parsed lane checklist. A run's body has the same shape. */
export interface ChecklistTemplateContent {
  intro: ChecklistProse;
  phases: ChecklistPhase[];
  /** Prose after the last phase's table, which applies to the whole checklist. */
  footer: ChecklistProse | null;
}

export type ChecklistRunBody = ChecklistTemplateContent;

/** One `## A. Title` (lookup) or `## 6. Title` (project) section. */
export interface ChecklistSection {
  key: string;
  title: string;
  markdown: string;
}

/** A parsed lookup table or project profile. */
export interface ChecklistSectionedContent {
  intro: string;
  sections: ChecklistSection[];
}

export type ChecklistDocContent = ChecklistTemplateContent | ChecklistSectionedContent;

export interface ChecklistDocSummary {
  kind: ChecklistDocKind;
  slug: string;
  title: string;
  archived: boolean;
  updatedAt: string;
}

export interface ChecklistDocDetail extends ChecklistDocSummary {
  content: ChecklistDocContent;
}

export interface ChecklistProgress {
  /** Tasks done or skipped. Groups are not counted, their children are. */
  complete: number;
  total: number;
}

export interface ChecklistRunSummary {
  id: string;
  name: string;
  templateSlug: string;
  templateTitle: string;
  projectSlug: string;
  status: ChecklistRunStatus;
  progress: ChecklistProgress;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistRunDetail extends ChecklistRunSummary {
  body: ChecklistRunBody;
  version: number;
}

/** What `POST /checklist/sync` did, per slug. */
export interface ChecklistSyncResult {
  created: string[];
  updated: string[];
  unchanged: string[];
  archived: string[];
}
