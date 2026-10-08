import { ChecklistDocKind, ChecklistRunStatus } from '@prisma/client';

import type { ChecklistDocContent, ChecklistRunBody } from '@portfolio/shared/types';

export interface ChecklistDocProps {
  id: string;
  kind: ChecklistDocKind;
  /** The file stem: `checklist-lane-l`, `bang-tra`, `portfolio`. */
  slug: string;
  title: string;
  content: ChecklistDocContent;
  /** SHA-256 of the markdown it was parsed from. */
  sourceHash: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A file from a push, after parsing. */
export interface ParsedChecklistFile {
  kind: ChecklistDocKind;
  slug: string;
  title: string;
  content: ChecklistDocContent;
  sourceHash: string;
}

export interface ChecklistRunProps {
  id: string;
  name: string;
  templateSlug: string;
  templateTitle: string;
  projectSlug: string;
  status: ChecklistRunStatus;
  body: ChecklistRunBody;
  /** Optimistic lock: bumped on every body save. */
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateChecklistRunPayload {
  name?: string;
  status?: ChecklistRunStatus;
}
