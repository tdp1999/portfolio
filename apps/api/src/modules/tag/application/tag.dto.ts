import { z } from 'zod/v4';

const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, '');

const TagNameSchema = z
  .string()
  .min(1)
  .max(50)
  .transform((v) => stripHtmlTags(v.trim()));

export const CreateTagSchema = z.object({
  name: TagNameSchema,
});

export const UpdateTagSchema = z.object({
  name: TagNameSchema,
});

export const TagQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
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
};
