import { z } from 'zod/v4';
import { TranslatableSchema, PaginatedQuerySchema, nonEmptyPartial } from '@portfolio/shared/utils';
import { ContentStatus } from '@prisma/client';
import { DisplayOrderSchema, TitleSchema, UrlSchema } from '@portfolio/shared/validation/zod';
import { LIMITS } from '@portfolio/shared/validation';

// --- TechnicalHighlightSchema ---

export const TechnicalHighlightSchema = z.object({
  challenge: TranslatableSchema,
  approach: TranslatableSchema,
  outcome: TranslatableSchema,
  codeUrl: UrlSchema.nullable().optional(),
});

// --- CreateProjectSchema ---

export const CreateProjectSchema = z.object({
  title: TitleSchema,
  oneLiner: TranslatableSchema,
  description: TranslatableSchema,
  motivation: TranslatableSchema,
  role: TranslatableSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  sourceUrl: UrlSchema.nullable().optional(),
  projectUrl: UrlSchema.nullable().optional(),
  thumbnailId: z.uuid().nullable().optional(),
  featured: z.boolean().default(false),
  displayOrder: DisplayOrderSchema.default(0),
  skillIds: z.array(z.uuid()).default([]),
  imageIds: z.array(z.uuid()).default([]),
  highlights: z.array(TechnicalHighlightSchema).max(LIMITS.PROJECT_HIGHLIGHTS_ARRAY_MAX).default([]),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

// --- UpdateProjectSchema ---

const UpdateProjectBaseSchema = z.object({
  title: TitleSchema,
  oneLiner: TranslatableSchema,
  description: TranslatableSchema,
  motivation: TranslatableSchema,
  role: TranslatableSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(ContentStatus),
  sourceUrl: UrlSchema.nullable().optional(),
  projectUrl: UrlSchema.nullable().optional(),
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
