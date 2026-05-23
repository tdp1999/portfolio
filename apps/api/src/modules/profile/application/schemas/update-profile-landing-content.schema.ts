import { z } from 'zod/v4';
import { TranslatableSchema } from '@portfolio/shared/utils';

/**
 * Each translatable landing block is nullable; `coreStack` is a non-translatable
 * array of short tokens (3–4) rendered as uppercase chips in the hero. FE sends
 * every key per command (matching the other per-section commands).
 *
 * `aboutHeading`/`aboutLede`/`ctaHeading`/`ctaLede` carry the `/about` narrative
 * copy (plain text per locale); they live on the same form section as the rest
 * of the landing copy so a single save updates them together.
 */
export const UpdateProfileLandingContentSchema = z.object({
  tagline: TranslatableSchema.nullable(),
  stackIntro: TranslatableSchema.nullable(),
  selectedWorkIntro: TranslatableSchema.nullable(),
  contactIntro: TranslatableSchema.nullable(),
  footerTagline: TranslatableSchema.nullable(),
  aboutHeading: TranslatableSchema.nullable(),
  aboutLede: TranslatableSchema.nullable(),
  ctaHeading: TranslatableSchema.nullable(),
  ctaLede: TranslatableSchema.nullable(),
  coreStack: z.array(z.string().min(1).max(40)).max(8).default([]),
});

export type UpdateProfileLandingContentDto = z.infer<typeof UpdateProfileLandingContentSchema>;
