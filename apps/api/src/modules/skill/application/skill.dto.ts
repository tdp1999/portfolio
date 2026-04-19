import { z } from 'zod/v4';
import { stripHtmlTags, nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';

const SkillCategoryEnum = z.enum(['TECHNICAL', 'TOOLS', 'ADDITIONAL']);

const SkillNameSchema = z
  .string()
  .min(1)
  .max(100)
  .transform((v) => stripHtmlTags(v.trim()));

const SkillDescriptionSchema = z
  .string()
  .min(1)
  .max(1000)
  .transform((v) => stripHtmlTags(v.trim()));

const SkillProficiencyNoteSchema = z
  .string()
  .min(1)
  .max(500)
  .transform((v) => stripHtmlTags(v.trim()));

export const CreateSkillSchema = z.object({
  name: SkillNameSchema,
  category: SkillCategoryEnum,
  description: SkillDescriptionSchema.optional(),
  isLibrary: z.boolean().default(false),
  parentSkillId: z.uuid().optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  iconId: z.uuid().optional(),
  proficiencyNote: SkillProficiencyNoteSchema.optional(),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

const UpdateSkillFieldsSchema = z.object({
  name: SkillNameSchema,
  category: SkillCategoryEnum,
  description: SkillDescriptionSchema.nullable(),
  isLibrary: z.boolean(),
  parentSkillId: z.uuid().nullable(),
  yearsOfExperience: z.number().int().min(0).max(50).nullable(),
  iconId: z.uuid().nullable(),
  proficiencyNote: SkillProficiencyNoteSchema.nullable(),
  isFeatured: z.boolean(),
  displayOrder: z.number().int(),
});

export const UpdateSkillSchema = nonEmptyPartial(UpdateSkillFieldsSchema);

export const SkillQuerySchema = PaginatedQuerySchema.extend({
  category: SkillCategoryEnum.optional(),
  isLibrary: z
    .union([z.boolean(), z.literal('true').transform(() => true), z.literal('false').transform(() => false)])
    .optional(),
  parentSkillId: z.uuid().optional(),
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
};
