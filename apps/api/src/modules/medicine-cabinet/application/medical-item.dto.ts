import { z } from 'zod/v4';
import { nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';
import { LIMITS } from '@portfolio/shared/validation';
import { optionalShortText, requiredShortText } from '@portfolio/shared/validation/zod';
import { MEDICINE_TIMINGS, MEDICINE_USAGE_TYPES } from '@portfolio/shared/types';

/** Fields only a medicine has ('R2 Field theo loại'). A supply that sends one gets 400 at that field. */
export const MEDICINE_ONLY_FIELDS = ['activeIngredients', 'strength', 'dose', 'timing', 'usageType'] as const;

export const MEDICINE_ONLY_MESSAGE = 'Only a medicine has this field';

/**
 * Ingredients that are empty after trim are dropped before the count is checked (P10), so
 * `["Simethicone", "  "]` becomes `["Simethicone"]`.
 */
const ActiveIngredientsSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value.filter((v) => typeof v !== 'string' || v.trim() !== '') : value),
  z.array(requiredShortText(LIMITS.ACTIVE_INGREDIENT_MAX)).max(LIMITS.ACTIVE_INGREDIENTS_ARRAY_MAX)
);

/** Optional text that may also be sent as `null` to clear it. */
const optionalText = (max: number) => optionalShortText(max).nullable().optional();

const commonFields = {
  profileId: z.uuid(),
  name: requiredShortText(LIMITS.MEDICAL_ITEM_NAME_MAX),
  purpose: optionalText(LIMITS.MEDICINE_PURPOSE_MAX),
  note: optionalText(LIMITS.MEDICAL_ITEM_NOTE_MAX),
  packForTravel: z.boolean().optional(),
};

const medicineFields = {
  activeIngredients: ActiveIngredientsSchema.optional(),
  strength: requiredShortText(LIMITS.MEDICINE_STRENGTH_MAX),
  dose: optionalText(LIMITS.MEDICINE_DOSE_MAX),
  timing: z.enum(MEDICINE_TIMINGS).nullable().optional(),
  usageType: z.enum(MEDICINE_USAGE_TYPES).nullable().optional(),
};

/** A supply declares each medicine field as `undefined`, so a sent value is reported at its own field. */
const supplyForbiddenFields = Object.fromEntries(
  MEDICINE_ONLY_FIELDS.map((field) => [field, z.undefined({ error: MEDICINE_ONLY_MESSAGE })])
) as Record<(typeof MEDICINE_ONLY_FIELDS)[number], z.ZodUndefined>;

// Both branches are strict: an unknown key gives 400 instead of being dropped silently.
export const CreateMedicalItemSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('MEDICINE'), ...commonFields, ...medicineFields }),
  z.strictObject({ kind: z.literal('SUPPLY'), ...commonFields, ...supplyForbiddenFields }),
]);

/**
 * PATCH cannot change `kind` (R2.4). The handler checks medicine fields against the stored kind (Q-48).
 * An empty body is rejected, so it cannot move `updatedAt` and reorder S1.
 */
export const UpdateMedicalItemSchema = nonEmptyPartial(
  z.strictObject({
    kind: z.undefined({ error: 'The type cannot change after creation' }),
    profileId: commonFields.profileId.optional(),
    name: commonFields.name.optional(),
    purpose: commonFields.purpose,
    note: commonFields.note,
    packForTravel: commonFields.packForTravel,
    activeIngredients: medicineFields.activeIngredients,
    strength: medicineFields.strength.optional(),
    dose: medicineFields.dose,
    timing: medicineFields.timing,
    usageType: medicineFields.usageType,
  })
);

export const MedicalItemQuerySchema = PaginatedQuerySchema.pick({ page: true, limit: true }).extend({
  profileId: z.uuid().optional(),
});

export type CreateMedicalItemDto = z.infer<typeof CreateMedicalItemSchema>;
export type UpdateMedicalItemDto = z.infer<typeof UpdateMedicalItemSchema>;
export type MedicalItemQueryDto = z.infer<typeof MedicalItemQuerySchema>;
