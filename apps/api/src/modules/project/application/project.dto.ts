import { z } from 'zod/v4';
import { TranslatableSchema, PaginatedQuerySchema, nonEmptyPartial } from '@portfolio/shared/utils';
import { ContentStatus } from '@prisma/client';
import { stripHtmlTags } from '@portfolio/shared/utils';

// --- TechnicalHighlightSchema ---

export const TechnicalHighlightSchema = z.object({
  challenge: TranslatableSchema,
  approach: TranslatableSchema,
  outcome: TranslatableSchema,
  codeUrl: z.url().max(500).nullable().optional(),
});

// --- CreateProjectSchema ---

export const CreateProjectSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .transform((v) => stripHtmlTags(v.trim())),
  oneLiner: TranslatableSchema,
  description: TranslatableSchema,
  motivation: TranslatableSchema,
  role: TranslatableSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  sourceUrl: z.url().max(500).nullable().optional(),
  projectUrl: z.url().max(500).nullable().optional(),
  thumbnailId: z.uuid().nullable().optional(),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
  skillIds: z.array(z.uuid()).default([]),
  imageIds: z.array(z.uuid()).default([]),
  highlights: z.array(TechnicalHighlightSchema).max(4).default([]),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

// --- UpdateProjectSchema ---

const UpdateProjectBaseSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(200)
    .transform((v) => stripHtmlTags(v.trim())),
  oneLiner: TranslatableSchema,
  description: TranslatableSchema,
  motivation: TranslatableSchema,
  role: TranslatableSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  status: z.nativeEnum(ContentStatus),
  sourceUrl: z.url().max(500).nullable().optional(),
  projectUrl: z.url().max(500).nullable().optional(),
  thumbnailId: z.uuid().nullable().optional(),
  featured: z.boolean(),
  displayOrder: z.number().int().min(0),
  skillIds: z.array(z.uuid()),
  imageIds: z.array(z.uuid()),
  highlights: z.array(TechnicalHighlightSchema).max(4),
});

export const UpdateProjectSchema = nonEmptyPartial(UpdateProjectBaseSchema);

export type UpdateProjectDto = z.infer<typeof UpdateProjectSchema>;

// --- ListProjectsSchema (admin) ---

export const ListProjectsSchema = PaginatedQuerySchema.extend({
  status: z.nativeEnum(ContentStatus).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

export type ListProjectsDto = z.infer<typeof ListProjectsSchema>;

// --- ReorderProjectsSchema ---

export const ReorderProjectsSchema = z
  .array(
    z.object({
      id: z.uuid(),
      displayOrder: z.number().int().min(0),
    })
  )
  .min(1);

export type ReorderProjectsDto = z.infer<typeof ReorderProjectsSchema>;
