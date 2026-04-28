import { z } from 'zod/v4';
import { LIMITS } from '@portfolio/shared/validation';

// Coerce empty strings to null so FE can safely send `""` for "no value".
const emptyToNull = (v: unknown): unknown => (v === '' ? null : v);

export const UpdateProfileSeoOgSchema = z.object({
  metaTitle: z.preprocess(emptyToNull, z.string().max(LIMITS.META_TITLE_MAX).nullable()),
  metaDescription: z.preprocess(emptyToNull, z.string().max(LIMITS.META_DESCRIPTION_MAX).nullable()),
  canonicalUrl: z.preprocess(emptyToNull, z.url().max(LIMITS.URL_MAX).nullable()),
});

export type UpdateProfileSeoOgDto = z.infer<typeof UpdateProfileSeoOgSchema>;
