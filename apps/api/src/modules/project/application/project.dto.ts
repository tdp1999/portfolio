import { z } from 'zod/v4';
import {
  TranslatableSchema,
  PartialTranslatableSchema,
  PaginatedQuerySchema,
  nonEmptyPartial,
} from '@portfolio/shared/utils';
import { ContentStatus, ProjectLifecycleStatus } from '@prisma/client';
import { DisplayOrderSchema, TitleSchema, UrlSchema } from '@portfolio/shared/validation/zod';
import { LIMITS } from '@portfolio/shared/validation';
import { PROJECT_LINK_TYPES } from '../domain/value-objects';

// --- TechnicalHighlightSchema ---

export const TechnicalHighlightSchema = z.object({
  challenge: TranslatableSchema,
  approach: TranslatableSchema,
  outcome: TranslatableSchema,
  codeUrl: UrlSchema.nullable().optional(),
});

// --- ProjectLinkSchema ---

export const ProjectLinkSchema = z.object({
  label: z.string().min(1).max(80),
  url: UrlSchema,
  type: z.enum(PROJECT_LINK_TYPES),
});

// --- CreateProjectSchema ---

export const CreateProjectSchema = z.object({
  title: TitleSchema,
  oneLiner: TranslatableSchema,
  description: TranslatableSchema,
  motivation: TranslatableSchema,
  role: TranslatableSchema,
  body: TranslatableSchema.nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  links: z.array(ProjectLinkSchema).default([]),
  thumbnailId: z.uuid().nullable().optional(),
  featured: z.boolean().default(false),
  displayOrder: DisplayOrderSchema.default(0),
  lifecycleStatus: z.nativeEnum(ProjectLifecycleStatus).default(ProjectLifecycleStatus.LIVE),
  skillIds: z.array(z.uuid()).default([]),
  imageIds: z.array(z.uuid()).default([]),
  highlights: z.array(TechnicalHighlightSchema).max(LIMITS.PROJECT_HIGHLIGHTS_ARRAY_MAX).default([]),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

// --- UpdateProjectSchema ---

// UPDATE allows partial-locale edits (PATCH semantics): user can save only `en`
// or only `vi` for any translatable field without re-sending the other locale.
// CREATE still requires both locales below.
const UpdateProjectBaseSchema = z.object({
  title: TitleSchema,
  oneLiner: PartialTranslatableSchema,
  description: PartialTranslatableSchema,
  motivation: PartialTranslatableSchema,
  role: PartialTranslatableSchema,
  body: PartialTranslatableSchema.nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(ContentStatus),
  lifecycleStatus: z.nativeEnum(ProjectLifecycleStatus),
  links: z.array(ProjectLinkSchema),
  thumbnailId: z.uuid().nullable().optional(),
  featured: z.boolean(),
  displayOrder: DisplayOrderSchema,
  skillIds: z.array(z.uuid()),
  imageIds: z.array(z.uuid()),
  highlights: z.array(TechnicalHighlightSchema).max(LIMITS.PROJECT_HIGHLIGHTS_ARRAY_MAX),
});

export const UpdateProjectSchema = nonEmptyPartial(UpdateProjectBaseSchema);

export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

// --- ListProjectsSchema (admin) ---

export const ListProjectsSchema = PaginatedQuerySchema.extend({
  status: z.nativeEnum(ContentStatus).optional(),
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['updatedAt', 'startDate', 'title', 'displayOrder']).default('updatedAt'),
});

export type ListProjectsDto = z.infer<typeof ListProjectsSchema>;

// --- ReorderProjectsSchema ---

export const ReorderProjectsSchema = z
  .array(
    z.object({
      id: z.uuid(),
      displayOrder: DisplayOrderSchema,
    })
  )
  .min(1);

export type ReorderProjectsDto = z.infer<typeof ReorderProjectsSchema>;
