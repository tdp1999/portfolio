import { z } from 'zod/v4';
import { Availability } from '@prisma/client';
import { OpenToSchema, TimezoneSchema } from '@portfolio/shared/utils';

export const UpdateProfileWorkAvailabilitySchema = z.object({
  yearsOfExperience: z.number().int().min(0).max(99),
  availability: z.nativeEnum(Availability),
  openTo: OpenToSchema,
  timezone: TimezoneSchema.nullable(),
});

export type UpdateProfileWorkAvailabilityDto = z.infer<typeof UpdateProfileWorkAvailabilitySchema>;
