import { z } from 'zod/v4';
import { PaginatedQuerySchema } from '@portfolio/shared/utils';
import { TagNameSchema } from '@portfolio/shared/validation/zod';

export const CreateTagSchema = z.object({
  name: TagNameSchema,
});

export const UpdateTagSchema = z.object({
  name: TagNameSchema,
});

export const TagQuerySchema = PaginatedQuerySchema.extend({
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['updatedAt', 'name']).default('updatedAt'),
});

export type CreateTagDto = z.infer<typeof CreateTagSchema>;
export type UpdateTagDto = z.infer<typeof UpdateTagSchema>;
export type TagQueryDto = z.infer<typeof TagQuerySchema>;

export type TagResponseDto = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
