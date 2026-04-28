import { z } from 'zod/v4';
import { SocialPlatform } from '@prisma/client';
import { EmailSchema, PhoneSchema } from '@portfolio/shared/validation/zod';
import { LIMITS } from '@portfolio/shared/validation';

export const UpdateProfileContactSchema = z.object({
  email: EmailSchema,
  phone: PhoneSchema.nullable(),
  preferredContactPlatform: z.nativeEnum(SocialPlatform),
  preferredContactValue: z.string().max(LIMITS.DESCRIPTION_SHORT_MAX),
});

export type UpdateProfileContactDto = z.infer<typeof UpdateProfileContactSchema>;
