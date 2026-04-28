import { z } from 'zod/v4';
import { LIMITS } from '@portfolio/shared/validation';

// Profile location strings are intentionally optional (no min(1)) — see ADR for rationale.
export const UpdateProfileLocationSchema = z.object({
  locationCountry: z.string().max(LIMITS.NAME_MAX),
  locationCity: z.string().max(LIMITS.NAME_MAX),
  locationPostalCode: z.string().max(LIMITS.POSTAL_CODE_MAX).nullable(),
  locationAddress1: z.string().max(LIMITS.ADDRESS_MAX).nullable(),
  locationAddress2: z.string().max(LIMITS.ADDRESS_MAX).nullable(),
});

export type UpdateProfileLocationDto = z.infer<typeof UpdateProfileLocationSchema>;
