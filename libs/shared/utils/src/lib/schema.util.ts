import { z } from 'zod/v4';

export const ERR_EMPTY_PAYLOAD = 'Update payload must contain at least one field';

export function nonEmptyPartial<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial().refine((data) => Object.keys(data).length > 0, {
    message: ERR_EMPTY_PAYLOAD,
    path: [],
  });
}

/** Structural strip only — output encoding in the frontend is the primary XSS defense */
export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

/** Base paginated query schema with page, limit, and optional search */
export const PaginatedQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});
