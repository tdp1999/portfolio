import { z } from 'zod/v4';
import { Availability } from '@prisma/client';
import { OpenToSchema, TimezoneSchema } from '@portfolio/shared/utils';
import { YearsOfExperienceSchema } from '@portfolio/shared/validation/zod';

export const UpdateProfileWorkAvailabilitySchema = z.object({
  yearsOfExperience: YearsOfExperienceSchema,
  availability: z.nativeEnum(Availability),
  openTo: OpenToSchema,
  timezones: z.array(TimezoneSchema).default([]),
});

export type UpdateProfileWorkAvailabilityDto = z.infer<typeof UpdateProfileWorkAvailabilitySchema>;
