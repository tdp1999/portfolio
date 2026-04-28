import { z } from 'zod/v4';
import { nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';
import {
  DescriptionLongSchema,
  DescriptionShortSchema,
  DisplayOrderSchema,
  NameSchema,
  YearsOfExperienceSchema,
} from '@portfolio/shared/validation/zod';

const SkillCategoryEnum = z.enum(['TECHNICAL', 'TOOLS', 'ADDITIONAL']);

export const CreateSkillSchema = z.object({
  name: NameSchema,
  category: SkillCategoryEnum,
  description: DescriptionLongSchema.optional(),
  isLibrary: z.boolean().default(false),
  parentSkillId: z.uuid().optional(),
  yearsOfExperience: YearsOfExperienceSchema.optional(),
  iconId: z.uuid().optional(),
  proficiencyNote: DescriptionShortSchema.optional(),
  isFeatured: z.boolean().default(false),
  displayOrder: DisplayOrderSchema.default(0),
});

const UpdateSkillFieldsSchema = z.object({
  name: NameSchema,
  category: SkillCategoryEnum,
  description: DescriptionLongSchema.nullable(),
  isLibrary: z.boolean(),
  parentSkillId: z.uuid().nullable(),
  yearsOfExperience: YearsOfExperienceSchema.nullable(),
  iconId: z.uuid().nullable(),
  proficiencyNote: DescriptionShortSchema.nullable(),
  isFeatured: z.boolean(),
  displayOrder: DisplayOrderSchema,
});

export const UpdateSkillSchema = nonEmptyPartial(UpdateSkillFieldsSchema);

export const SkillQuerySchema = PaginatedQuerySchema.extend({
  category: SkillCategoryEnum.optional(),
  isLibrary: z
    .union([z.boolean(), z.literal('true').transform(() => true), z.literal('false').transform(() => false)])
    .optional(),
  parentSkillId: z.uuid().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  sortBy: z.enum(['updatedAt', 'name', 'displayOrder']).default('updatedAt'),
});

export type CreateSkillDto = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillDto = z.infer<typeof UpdateSkillSchema>;
export type SkillQueryDto = z.infer<typeof SkillQuerySchema>;

export type SkillResponseDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  isLibrary: boolean;
  parentSkillId: string | null;
  yearsOfExperience: number | null;
  iconId: string | null;
  iconUrl: string | null;
  proficiencyNote: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
