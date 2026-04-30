import { z } from 'zod/v4';
import { EmploymentType, LocationType } from '@prisma/client';
import {
  TranslatableSchema,
  OptionalTranslatableSchema,
  TranslatableStringArraySchema,
  PaginatedQuerySchema,
  nonEmptyPartial,
} from '@portfolio/shared/utils';
import {
  AddressLineSchema,
  DisplayOrderSchema,
  OptionalDateSchema,
  PostalCodeSchema,
  TeamSizeSchema,
  TitleSchema,
  UrlSchema,
  optionalShortText,
  requiredShortText,
  withDateRange,
} from '@portfolio/shared/validation/zod';
import { LIMITS } from '@portfolio/shared/validation';

const LinkSchema = z.object({
  label: requiredShortText(LIMITS.NAME_MAX),
  url: UrlSchema,
});

// --- CreateExperienceSchema ---

const teamSizeRangeRefine = (v: { teamSizeMin?: number; teamSizeMax?: number }) =>
  v.teamSizeMin === undefined || v.teamSizeMax === undefined || v.teamSizeMin <= v.teamSizeMax;

export const CreateExperienceSchema = withDateRange(
  z.object({
    companyName: TitleSchema,
    companyUrl: UrlSchema.optional(),
    companyLogoId: z.uuid().optional(),
    position: TranslatableSchema,
    description: OptionalTranslatableSchema.optional(),
    responsibilities: TranslatableStringArraySchema.default({ en: [], vi: [] }),
    highlights: TranslatableStringArraySchema.default({ en: [], vi: [] }),
    teamRole: OptionalTranslatableSchema.optional(),
    links: z.array(LinkSchema).default([]),
    employmentType: z.nativeEnum(EmploymentType).default('FULL_TIME'),
    locationType: z.nativeEnum(LocationType).default('ONSITE'),
    locationCountry: requiredShortText(LIMITS.NAME_MAX),
    locationCity: optionalShortText(LIMITS.NAME_MAX).optional(),
    locationPostalCode: PostalCodeSchema.optional(),
    locationAddress1: AddressLineSchema.optional(),
    locationAddress2: AddressLineSchema.optional(),
    clientName: optionalShortText(LIMITS.TITLE_MAX).optional(),
    domain: optionalShortText(LIMITS.NAME_MAX).optional(),
    teamSizeMin: TeamSizeSchema.optional(),
    teamSizeMax: TeamSizeSchema.optional(),
    startDate: z.coerce.date(),
    endDate: OptionalDateSchema,
    skillIds: z.array(z.uuid()).default([]),
    displayOrder: DisplayOrderSchema.default(0),
  })
).refine(teamSizeRangeRefine, { message: 'teamSizeMin must be <= teamSizeMax', path: ['teamSizeMax'] });

export type CreateExperienceDto = z.infer<typeof CreateExperienceSchema>;

// --- UpdateExperienceSchema ---
// Uses a base schema without defaults so nonEmptyPartial correctly rejects empty objects.

const UpdateExperienceBaseSchema = z.object({
  companyName: TitleSchema,
  companyUrl: UrlSchema.optional(),
  companyLogoId: z.uuid().nullable().optional(),
  position: TranslatableSchema,
  description: OptionalTranslatableSchema.optional(),
  responsibilities: TranslatableStringArraySchema,
  highlights: TranslatableStringArraySchema,
  teamRole: OptionalTranslatableSchema.optional(),
  links: z.array(LinkSchema),
  employmentType: z.nativeEnum(EmploymentType),
  locationType: z.nativeEnum(LocationType),
  locationCountry: requiredShortText(LIMITS.NAME_MAX).optional(),
  locationCity: optionalShortText(LIMITS.NAME_MAX).optional(),
  locationPostalCode: PostalCodeSchema.optional(),
  locationAddress1: AddressLineSchema.optional(),
  locationAddress2: AddressLineSchema.optional(),
  clientName: optionalShortText(LIMITS.TITLE_MAX).optional(),
  domain: optionalShortText(LIMITS.NAME_MAX).optional(),
  teamSizeMin: TeamSizeSchema.nullable().optional(),
  teamSizeMax: TeamSizeSchema.nullable().optional(),
  startDate: z.coerce.date(),
  endDate: OptionalDateSchema,
  skillIds: z.array(z.uuid()),
  displayOrder: DisplayOrderSchema,
});

export const UpdateExperienceSchema = withDateRange(nonEmptyPartial(UpdateExperienceBaseSchema)).refine(
  (v) => {
    const min = v.teamSizeMin;
    const max = v.teamSizeMax;
    return min == null || max == null || min <= max;
  },
  { message: 'teamSizeMin must be <= teamSizeMax', path: ['teamSizeMax'] }
);

export type UpdateExperienceDto = z.infer<typeof UpdateExperienceSchema>;

// --- ListExperiencesSchema ---

export const ListExperiencesSchema = PaginatedQuerySchema.extend({
  employmentType: z.nativeEnum(EmploymentType).optional(),
  locationType: z.nativeEnum(LocationType).optional(),
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['updatedAt', 'startDate', 'companyName', 'displayOrder']).default('updatedAt'),
});

export type ListExperiencesDto = z.infer<typeof ListExperiencesSchema>;

// --- ReorderExperiencesSchema ---

export const ReorderExperiencesSchema = z
  .array(
    z.object({
      id: z.uuid(),
      displayOrder: DisplayOrderSchema,
    })
  )
  .min(1);

export type ReorderExperiencesDto = z.infer<typeof ReorderExperiencesSchema>;
