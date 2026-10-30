import { ChecklistDocKind, ChecklistRunStatus } from '@prisma/client';
import { z } from 'zod/v4';

import { CHECKLIST_ROW_STATES } from '@portfolio/shared/types';

const MAX_TEXT = 2_000;
const MAX_NOTE = 5_000;
const MAX_PROSE = 20_000;
const MAX_LANES = 20;
/** A ref key: a lookup letter, a profile section number, or a `⚙` marker name such as `review-design`. */
export const MAX_REF_KEY = 40;

/** A file path inside the checklist folder: relative, no `..`, a markdown file. */
const SourcePathSchema = z
  .string()
  .max(300)
  .regex(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[\w./-]+\.md$/, 'must be a .md path inside the checklist folder');

/** `manifest.json` of the checklist folder: the lanes to show and the lookup table. */
export const ChecklistManifestSchema = z
  .object({
    format: z.number().int().positive(),
    lanes: z
      .array(
        z.object({
          slug: z
            .string()
            .max(100)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
          title: z.string().trim().min(1).max(200),
          path: SourcePathSchema,
        })
      )
      .min(1)
      .max(MAX_LANES),
    lookup: SourcePathSchema,
  })
  .refine((m) => new Set(m.lanes.map((lane) => lane.slug)).size === m.lanes.length, {
    message: 'each lane needs its own slug',
    path: ['lanes'],
  })
  .refine((m) => new Set([...m.lanes.map((lane) => lane.path), m.lookup]).size === m.lanes.length + 1, {
    message: 'each lane and the lookup table need their own file',
    path: ['lanes'],
  });
export type ChecklistManifest = z.infer<typeof ChecklistManifestSchema>;

export const ListChecklistDocsSchema = z.object({
  kind: z.enum(ChecklistDocKind).optional(),
});

export const CreateChecklistRunSchema = z.object({
  name: z.string().trim().min(1).max(200),
  templateSlug: z.string().trim().min(1).max(100),
  /** The project's name as the Owner types it (`portfolio`, `workbuddy-fsm`); no profile is looked up. */
  projectSlug: z.string().trim().min(1).max(100),
});

export const UpdateChecklistRunSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    status: z.enum(ChecklistRunStatus).optional(),
  })
  .refine((data) => data.name !== undefined || data.status !== undefined, { message: 'Nothing to update' });

export const ChecklistRefSchema = z.object({
  kind: z.enum(['lookup', 'project']),
  key: z.string().min(1).max(MAX_REF_KEY),
});
const RefSchema = ChecklistRefSchema;
const ProseSchema = z.object({ markdown: z.string().max(MAX_PROSE), refs: z.array(RefSchema) });
const RowIdSchema = z.string().min(1).max(64);

const SnSchema = z.string().min(1).max(20);
const ItemsSchema = z.array(z.string().max(MAX_TEXT)).max(50);

const TaskSchema = z.object({
  kind: z.literal('task'),
  id: RowIdSchema,
  sn: SnSchema.optional(),
  text: z.string().max(MAX_TEXT),
  description: z.string().max(MAX_TEXT).optional(),
  items: ItemsSchema.optional(),
  claude: z.boolean().optional(),
  refs: z.array(RefSchema),
  doer: z.string().max(MAX_TEXT),
  checker: z.string().max(MAX_TEXT),
  state: z.enum(CHECKLIST_ROW_STATES),
  note: z.string().max(MAX_NOTE),
});

const GroupSchema = z.object({
  kind: z.literal('group'),
  id: RowIdSchema,
  sn: SnSchema.optional(),
  text: z.string().max(MAX_TEXT),
  description: z.string().max(MAX_TEXT).optional(),
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

/** A run's body, and a lane once parsed: a lane that breaks it could never be saved as a run. */
export const ChecklistRunBodySchema = z.object({
  intro: ProseSchema,
  phases: z.array(PhaseSchema),
  footer: ProseSchema.nullable(),
});

export const SaveChecklistRunBodySchema = z.object({
  /** The version the page loaded; an older one means another tab saved first. */
  version: z.number().int().positive(),
  body: ChecklistRunBodySchema,
});
