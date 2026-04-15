import { z } from 'zod/v4';

// Coerce empty strings to null so FE can safely send `""` for "no value".
const emptyToNull = (v: unknown): unknown => (v === '' ? null : v);

export const UpdateProfileSeoOgSchema = z.object({
  metaTitle: z.preprocess(emptyToNull, z.string().max(70).nullable()),
  metaDescription: z.preprocess(emptyToNull, z.string().max(160).nullable()),
  canonicalUrl: z.preprocess(emptyToNull, z.url().nullable()),
});

export type UpdateProfileSeoOgDto = z.infer<typeof UpdateProfileSeoOgSchema>;
