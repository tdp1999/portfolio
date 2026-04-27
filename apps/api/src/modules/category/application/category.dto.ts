import { z } from 'zod/v4';
import { stripHtmlTags, nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';

const CategoryNameSchema = z
  .string()
  .min(1)
  .max(100)
  .transform((v) => stripHtmlTags(v.trim()));

const CategoryDescriptionSchema = z
  .string()
  .min(1)
  .max(500)
  .transform((v) => stripHtmlTags(v.trim()));

export const CreateCategorySchema = z.object({
  name: CategoryNameSchema,
  description: CategoryDescriptionSchema.optional(),
  displayOrder: z.number().int().default(0),
});

const UpdateCategoryFieldsSchema = z.object({
  name: CategoryNameSchema,
  description: CategoryDescriptionSchema.nullable(),
  displayOrder: z.number().int(),
});

export const UpdateCategorySchema = nonEmptyPartial(UpdateCategoryFieldsSchema);

export const CategoryQuerySchema = PaginatedQuerySchema.extend({
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['updatedAt', 'name', 'displayOrder']).default('updatedAt'),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
export type CategoryQueryDto = z.infer<typeof CategoryQuerySchema>;

export type CategoryResponseDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
