import { z } from 'zod/v4';
import { LIMITS } from '@portfolio/shared/validation';
import { requiredShortText } from '@portfolio/shared/validation/zod';

export const CreateHealthProfileSchema = z.strictObject({
  name: requiredShortText(LIMITS.HEALTH_PROFILE_NAME_MAX),
});

export const RenameHealthProfileSchema = CreateHealthProfileSchema;

export type CreateHealthProfileDto = z.infer<typeof CreateHealthProfileSchema>;
export type RenameHealthProfileDto = z.infer<typeof RenameHealthProfileSchema>;
