import { z } from 'zod/v4';
import { ABOUT_FAILURE_LIMITS } from '../domain/about-failure.types';

const TranslatableTextSchema = (max: number, label: string) =>
  z.object({
    en: z.string().trim().min(1, `${label}.en is required`).max(max, `${label}.en must be ≤ ${max} chars`),
    vi: z.string().trim().max(max, `${label}.vi must be ≤ ${max} chars`).default(''),
  });

const YearSchema = () =>
  z
    .number()
    .int(`year must be an integer`)
    .min(ABOUT_FAILURE_LIMITS.YEAR_MIN, `year must be ≥ ${ABOUT_FAILURE_LIMITS.YEAR_MIN}`)
    // Upper bound enforced in the domain VO (uses runtime current year).
    .max(9999, `year must be ≤ 9999`);

export const CreateAboutFailureSchema = z.object({
  order: z.number().int().min(0).optional(),
  year: YearSchema(),
  context: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.CONTEXT_MAX, 'context'),
  decision: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.NARRATIVE_MAX, 'decision'),
  consequence: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.NARRATIVE_MAX, 'consequence'),
  lesson: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.NARRATIVE_MAX, 'lesson'),
  isPublished: z.boolean().default(true),
});

export const UpdateAboutFailureSchema = z
  .object({
    order: z.number().int().min(0).optional(),
    year: YearSchema().optional(),
    context: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.CONTEXT_MAX, 'context').optional(),
    decision: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.NARRATIVE_MAX, 'decision').optional(),
    consequence: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.NARRATIVE_MAX, 'consequence').optional(),
    lesson: TranslatableTextSchema(ABOUT_FAILURE_LIMITS.NARRATIVE_MAX, 'lesson').optional(),
    isPublished: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.order !== undefined ||
      v.year !== undefined ||
      v.context !== undefined ||
      v.decision !== undefined ||
      v.consequence !== undefined ||
      v.lesson !== undefined ||
      v.isPublished !== undefined,
    { message: 'At least one field must be provided' }
  );

export const ReorderAboutFailuresSchema = z.object({
  ids: z.array(z.uuid()).min(1, 'ids must contain at least one id'),
});

export type CreateAboutFailureDto = z.infer<typeof CreateAboutFailureSchema>;
export type UpdateAboutFailureDto = z.infer<typeof UpdateAboutFailureSchema>;
export type ReorderAboutFailuresDto = z.infer<typeof ReorderAboutFailuresSchema>;

export interface AboutFailureDto {
  id: string;
  order: number;
  year: number;
  context: { en: string; vi: string };
  decision: { en: string; vi: string };
  consequence: { en: string; vi: string };
  lesson: { en: string; vi: string };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AboutFailureListResponse {
  items: AboutFailureDto[];
}
