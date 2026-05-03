import { z } from 'zod/v4';
import { TranslatableSchema } from '@portfolio/shared/utils';

/**
 * Each landing content block is an optional translatable JSON object.
 * `null` clears the block; omitting the key leaves it unchanged is NOT supported here —
 * the FE is expected to always send all four fields (matching how the other
 * per-section commands operate).
 */
export const UpdateProfileLandingContentSchema = z.object({
  tagline: TranslatableSchema.nullable(),
  stackIntro: TranslatableSchema.nullable(),
  contactIntro: TranslatableSchema.nullable(),
  footerTagline: TranslatableSchema.nullable(),
});

export type UpdateProfileLandingContentDto = z.infer<typeof UpdateProfileLandingContentSchema>;
