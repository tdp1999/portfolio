import { z } from 'zod/v4';
import { SocialPlatform } from '@prisma/client';

export const UpdateProfileContactSchema = z.object({
  email: z.email().max(320),
  phone: z.string().max(20).nullable(),
  preferredContactPlatform: z.nativeEnum(SocialPlatform),
  preferredContactValue: z.string().max(500),
});

export type UpdateProfileContactDto = z.infer<typeof UpdateProfileContactSchema>;
