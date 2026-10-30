import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { LIMITS, textLength } from '@portfolio/shared/validation';
import type { MedicalItemPayload } from '../medicine-cabinet.types';

/** Fields the API accepts only on a medicine (R2.2). A supply payload leaves them out, even as keys. */
export const MEDICINE_ONLY_FIELDS = ['activeIngredients', 'strength', 'dose', 'timing', 'usageType'] as const;

/** Value of the "+ Add new person" option of the Person input. It is never saved. */
export const ADD_PERSON = '__add_person__';

/** Up to 10 ingredients of up to 100 characters each (AC-19). */
export function ingredientsValidator(): ValidatorFn {
  return (control: AbstractControl<string[] | null>): ValidationErrors | null => {
    const values = control.value ?? [];
    if (values.length > LIMITS.ACTIVE_INGREDIENTS_ARRAY_MAX) {
      return { ingredientsMax: { max: LIMITS.ACTIVE_INGREDIENTS_ARRAY_MAX } };
    }
    if (values.some((v) => textLength(v) > LIMITS.ACTIVE_INGREDIENT_MAX)) {
      return { ingredientMaxLength: { max: LIMITS.ACTIVE_INGREDIENT_MAX } };
    }
    return null;
  };
}

const OPTIONAL_TEXT = ['dose', 'purpose', 'note'] as const;

/**
 * Turns the form value into the request body. Disabled inputs are already absent from the value:
 * the medicine inputs on a supply, and the type when editing. A blank optional text clears the field.
 */
export function toMedicalItemPayload(value: MedicalItemPayload): MedicalItemPayload {
  const payload: MedicalItemPayload = { ...value };
  for (const field of OPTIONAL_TEXT) {
    if (field in payload && !payload[field]?.trim()) payload[field] = null;
  }
  return payload;
}
