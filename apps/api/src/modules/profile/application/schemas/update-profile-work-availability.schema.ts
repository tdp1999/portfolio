import { z } from 'zod/v4';
import { Availability } from '@prisma/client';
import { OpenToSchema, TimezoneSchema } from '@portfolio/shared/utils';
import { YearsOfExperienceSchema } from '@portfolio/shared/validation/zod';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const WorkingHoursSchema = z
  .object({
    start: z.string().regex(HHMM, 'must be HH:mm (00:00–23:59)'),
    end: z.string().regex(HHMM, 'must be HH:mm (00:00–23:59)'),
  })
  .refine(
    (v) => {
      const toMin = (s: string) => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m;
      };
      return toMin(v.end) > toMin(v.start);
    },
    { message: 'end must be after start', path: ['end'] }
  );

export const UpdateProfileWorkAvailabilitySchema = z.object({
  yearsOfExperience: YearsOfExperienceSchema,
  availability: z.nativeEnum(Availability),
  openTo: OpenToSchema,
  timezones: z.array(TimezoneSchema).default([]),
  workingHours: WorkingHoursSchema.nullable().default(null),
});

export type UpdateProfileWorkAvailabilityDto = z.infer<typeof UpdateProfileWorkAvailabilitySchema>;
