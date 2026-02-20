import { z } from 'zod/v4';

export const ERR_EMPTY_PAYLOAD = 'Update payload must contain at least one field';

export function nonEmptyPartial<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial().refine((data) => Object.keys(data).length > 0, {
    message: ERR_EMPTY_PAYLOAD,
    path: [],
  });
}
