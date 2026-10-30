import type { MedicalItemKind } from '@portfolio/shared/types';

export interface MedicalItemDisplayInput {
  kind: MedicalItemKind;
  name: string;
  activeIngredients: readonly string[];
}

export interface MedicalItemDisplay {
  /** Main name ('DT-1 Tên hiển thị'). */
  primary: string;
  /** Sub-line under the main name, or `null` when there is none. */
  secondary: string | null;
  /** A supply gets the "Vật tư" badge. */
  isSupply: boolean;
}

/**
 * Display name of a medical item ('DT-1 Tên hiển thị', R1). A medicine with exactly one active
 * ingredient leads with the ingredient; otherwise the product name leads and the ingredients, if
 * any, form the sub-line. A supply never has a sub-line.
 */
export function medicalItemDisplay(item: MedicalItemDisplayInput): MedicalItemDisplay {
  if (item.kind === 'SUPPLY') {
    return { primary: item.name, secondary: null, isSupply: true };
  }
  const ingredients = item.activeIngredients;
  if (ingredients.length === 1) {
    return { primary: ingredients[0], secondary: item.name, isSupply: false };
  }
  return {
    primary: item.name,
    secondary: ingredients.length > 1 ? ingredients.join(' + ') : null,
    isSupply: false,
  };
}
