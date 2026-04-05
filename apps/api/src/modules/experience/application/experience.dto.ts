import { z } from 'zod/v4';
import { EmploymentType, LocationType } from '@prisma/client';
import {
  TranslatableSchema,
  OptionalTranslatableSchema,
  TranslatableStringArraySchema,
  PaginatedQuerySchema,
  nonEmptyPartial,
} from '@portfolio/shared/utils';

// --- CreateExperienceSchema ---

export const CreateExperienceSchema = z.object({
  companyName: z.string().min(1).max(200),
  companyUrl: z.url().max(500).optional(),
  companyLogoId: z.uuid().optional(),
  position: TranslatableSchema,
  description: OptionalTranslatableSchema.optional(),
  achievements: TranslatableStringArraySchema.default({ en: [], vi: [] }),
  teamRole: OptionalTranslatableSchema.optional(),
  employmentType: z.nativeEnum(EmploymentType).default('FULL_TIME'),
  locationType: z.nativeEnum(LocationType).default('ONSITE'),
  locationCountry: z.string().min(1).max(100),
  locationCity: z.string().max(100).optional(),
  locationPostalCode: z.string().max(20).optional(),
  locationAddress1: z.string().max(300).optional(),
  locationAddress2: z.string().max(300).optional(),
  clientName: z.string().max(200).optional(),
  clientIndustry: z.string().max(100).optional(),
  domain: z.string().max(100).optional(),
  teamSize: z.number().int().min(1).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  skillIds: z.array(z.uuid()).default([]),
  displayOrder: z.number().int().min(0).default(0),
});

export type CreateExperienceDto = z.infer<typeof CreateExperienceSchema>;

// --- UpdateExperienceSchema ---
// Uses a base schema without defaults so nonEmptyPartial correctly rejects empty objects.

const UpdateExperienceBaseSchema = z.object({
  companyName: z.string().min(1).max(200),
  companyUrl: z.url().max(500).optional(),
  companyLogoId: z.uuid().optional(),
  position: TranslatableSchema,
  description: OptionalTranslatableSchema.optional(),
  achievements: TranslatableStringArraySchema,
  teamRole: OptionalTranslatableSchema.optional(),
  employmentType: z.nativeEnum(EmploymentType),
  locationType: z.nativeEnum(LocationType),
  locationCountry: z.string().min(1).max(100).optional(),
  locationCity: z.string().max(100).optional(),
  locationPostalCode: z.string().max(20).optional(),
  locationAddress1: z.string().max(300).optional(),
  locationAddress2: z.string().max(300).optional(),
  clientName: z.string().max(200).optional(),
  clientIndustry: z.string().max(100).optional(),
  domain: z.string().max(100).optional(),
  teamSize: z.number().int().min(1).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  skillIds: z.array(z.uuid()),
  displayOrder: z.number().int().min(0),
});

export const UpdateExperienceSchema = nonEmptyPartial(UpdateExperienceBaseSchema);

export type UpdateExperienceDto = z.infer<typeof UpdateExperienceSchema>;

// --- ListExperiencesSchema ---

export const ListExperiencesSchema = PaginatedQuerySchema.extend({
  employmentType: z.nativeEnum(EmploymentType).optional(),
  locationType: z.nativeEnum(LocationType).optional(),
  includeDeleted: z.coerce.boolean().default(false),
});

export type ListExperiencesDto = z.infer<typeof ListExperiencesSchema>;

// --- ReorderExperiencesSchema ---

export const ReorderExperiencesSchema = z
  .array(
    z.object({
      id: z.uuid(),
      displayOrder: z.number().int().min(0),
    })
  )
  .min(1);

export type ReorderExperiencesDto = z.infer<typeof ReorderExperiencesSchema>;
