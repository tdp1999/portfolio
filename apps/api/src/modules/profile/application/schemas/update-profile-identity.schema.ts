import { z } from 'zod/v4';
import { TranslatableSchema, OptionalTranslatableSchema } from '@portfolio/shared/utils';
import { BilingualEditorDocumentSchema } from '../../../rich-text';

export const UpdateProfileIdentitySchema = z.object({
  fullName: TranslatableSchema,
  title: TranslatableSchema,
  bioShort: TranslatableSchema,
  bioLong: OptionalTranslatableSchema.nullable(),
  // Rich-text bioLong (RTE). Optional + additive: the console (task 311) sends the
  // bilingual editor document here; legacy markdown `bioLong` stays alongside until
  // markdown cleanup. Absent → identity-only update, rich columns untouched.
  bioLongJson: BilingualEditorDocumentSchema.optional(),
});

export type UpdateProfileIdentityDto = z.infer<typeof UpdateProfileIdentitySchema>;
