import { z } from 'zod/v4';
import { nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';
import { DescriptionShortSchema, DisplayOrderSchema, NameSchema } from '@portfolio/shared/validation/zod';

export const CreateCategorySchema = z.object({
  name: NameSchema,
  description: DescriptionShortSchema.optional(),
  displayOrder: DisplayOrderSchema.default(0),
});

const UpdateCategoryFieldsSchema = z.object({
  name: NameSchema,
  description: DescriptionShortSchema.nullable(),
  displayOrder: DisplayOrderSchema,
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
