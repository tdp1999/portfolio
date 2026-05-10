import { z } from 'zod/v4';
import { TranslatableSchema } from '@portfolio/shared/utils';

/**
 * Each translatable landing block is nullable; `coreStack` is a non-translatable
 * array of short tokens (3–4) rendered as uppercase chips in the hero. FE sends
 * all five keys per command (matching the other per-section commands).
 */
export const UpdateProfileLandingContentSchema = z.object({
  tagline: TranslatableSchema.nullable(),
  stackIntro: TranslatableSchema.nullable(),
  contactIntro: TranslatableSchema.nullable(),
  footerTagline: TranslatableSchema.nullable(),
  coreStack: z.array(z.string().min(1).max(40)).max(8).default([]),
});

export type UpdateProfileLandingContentDto = z.infer<typeof UpdateProfileLandingContentSchema>;
