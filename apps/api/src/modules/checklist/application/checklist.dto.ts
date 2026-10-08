import { ChecklistDocKind, ChecklistRunStatus } from '@prisma/client';
import { z } from 'zod/v4';

import { CHECKLIST_ROW_STATES } from '@portfolio/shared/types';

const MAX_FILE_CHARS = 200_000;
const MAX_FILES = 100;
const MAX_TEXT = 2_000;
const MAX_NOTE = 5_000;
const MAX_PROSE = 20_000;

export const SyncChecklistDocsSchema = z.object({
  files: z
    .array(
      z.object({
        /** Relative to the workflow folder: `checklist-lane-l.md`, `projects/portfolio.md`. */
        path: z.string().trim().min(1).max(300),
        content: z.string().max(MAX_FILE_CHARS),
      })
    )
    .min(1)
    .max(MAX_FILES),
});

export const ListChecklistDocsSchema = z.object({
  kind: z.enum(ChecklistDocKind).optional(),
});

export const CreateChecklistRunSchema = z.object({
  name: z.string().trim().min(1).max(200),
  templateSlug: z.string().trim().min(1).max(100),
  projectSlug: z.string().trim().min(1).max(100),
});

export const UpdateChecklistRunSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    status: z.enum(ChecklistRunStatus).optional(),
  })
  .refine((data) => data.name !== undefined || data.status !== undefined, { message: 'Nothing to update' });

const RefSchema = z.object({ kind: z.enum(['lookup', 'project']), key: z.string().min(1).max(10) });
const ProseSchema = z.object({ markdown: z.string().max(MAX_PROSE), refs: z.array(RefSchema) });
const RowIdSchema = z.string().min(1).max(64);

const TaskSchema = z.object({
  kind: z.literal('task'),
  id: RowIdSchema,
  text: z.string().max(MAX_TEXT),
  refs: z.array(RefSchema),
  doer: z.string().max(MAX_TEXT),
  checker: z.string().max(MAX_TEXT),
  state: z.enum(CHECKLIST_ROW_STATES),
  note: z.string().max(MAX_NOTE),
});

const GroupSchema = z.object({
  kind: z.literal('group'),
  id: RowIdSchema,
  text: z.string().max(MAX_TEXT),
  refs: z.array(RefSchema),
  note: z.string().max(MAX_NOTE),
  children: z.array(TaskSchema),
});

const PhaseSchema = z.object({
  id: RowIdSchema,
  number: z.number().int().nullable(),
  name: z.string().max(MAX_TEXT),
  role: z.string().max(MAX_TEXT).nullable(),
  gate: ProseSchema.nullable(),
  note: ProseSchema.nullable(),
  rows: z.array(z.discriminatedUnion('kind', [TaskSchema, GroupSchema])),
});

export const SaveChecklistRunBodySchema = z.object({
  /** The version the page loaded; an older one means another tab saved first. */
  version: z.number().int().positive(),
  body: z.object({
    intro: ProseSchema,
    phases: z.array(PhaseSchema),
    footer: ProseSchema.nullable(),
  }),
});
