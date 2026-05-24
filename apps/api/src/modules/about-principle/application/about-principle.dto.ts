import { z } from 'zod/v4';
import { ABOUT_PRINCIPLE_LIMITS } from '../domain/about-principle.types';

const TranslatableTextSchema = (max: number, label: string) =>
  z.object({
    en: z.string().trim().min(1, `${label}.en is required`).max(max, `${label}.en must be ≤ ${max} chars`),
    vi: z.string().trim().max(max, `${label}.vi must be ≤ ${max} chars`).default(''),
  });

export const CreateAboutPrincipleSchema = z.object({
  order: z.number().int().min(0).optional(),
  claim: TranslatableTextSchema(ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX, 'claim'),
  expansion: TranslatableTextSchema(ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX, 'expansion'),
  isPublished: z.boolean().default(true),
});

export const UpdateAboutPrincipleSchema = z
  .object({
    order: z.number().int().min(0).optional(),
    claim: TranslatableTextSchema(ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX, 'claim').optional(),
    expansion: TranslatableTextSchema(ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX, 'expansion').optional(),
    isPublished: z.boolean().optional(),
  })
  .refine(
    (v) => v.order !== undefined || v.claim !== undefined || v.expansion !== undefined || v.isPublished !== undefined,
    { message: 'At least one field must be provided' }
  );

export const ReorderAboutPrinciplesSchema = z.object({
  ids: z.array(z.uuid()).min(1, 'ids must contain at least one id'),
});

export type CreateAboutPrincipleDto = z.infer<typeof CreateAboutPrincipleSchema>;
export type UpdateAboutPrincipleDto = z.infer<typeof UpdateAboutPrincipleSchema>;
export type ReorderAboutPrinciplesDto = z.infer<typeof ReorderAboutPrinciplesSchema>;

export interface AboutPrincipleDto {
  id: string;
  order: number;
  claim: { en: string; vi: string };
  expansion: { en: string; vi: string };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AboutPrincipleListResponse {
  items: AboutPrincipleDto[];
}
