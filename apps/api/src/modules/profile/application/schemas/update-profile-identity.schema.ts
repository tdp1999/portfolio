import { z } from 'zod/v4';
import { TranslatableSchema, OptionalTranslatableSchema } from '@portfolio/shared/utils';

export const UpdateProfileIdentitySchema = z.object({
  fullName: TranslatableSchema,
  title: TranslatableSchema,
  bioShort: TranslatableSchema,
  bioLong: OptionalTranslatableSchema.nullable(),
});

export type UpdateProfileIdentityDto = z.infer<typeof UpdateProfileIdentitySchema>;
