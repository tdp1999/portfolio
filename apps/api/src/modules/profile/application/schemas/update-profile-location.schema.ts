import { z } from 'zod/v4';

export const UpdateProfileLocationSchema = z.object({
  locationCountry: z.string().max(100),
  locationCity: z.string().max(100),
  locationPostalCode: z.string().max(20).nullable(),
  locationAddress1: z.string().max(300).nullable(),
  locationAddress2: z.string().max(300).nullable(),
});

export type UpdateProfileLocationDto = z.infer<typeof UpdateProfileLocationSchema>;
