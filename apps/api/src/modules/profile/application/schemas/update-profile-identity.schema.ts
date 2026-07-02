import { z } from 'zod/v4';
import { TranslatableSchema } from '@portfolio/shared/utils';
import { BilingualEditorDocumentSchema } from '../../../rich-text';

export const UpdateProfileIdentitySchema = z.object({
  fullName: TranslatableSchema,
  title: TranslatableSchema,
  bioShort: TranslatableSchema,
  // Rich-text long bio. Optional: the console sends the bilingual editor document
  // here. Absent → identity-only update, rich columns untouched.
  bioLongJson: BilingualEditorDocumentSchema.optional(),
});

export type UpdateProfileIdentityDto = z.infer<typeof UpdateProfileIdentitySchema>;
