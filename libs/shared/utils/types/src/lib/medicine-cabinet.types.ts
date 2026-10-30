/**
 * Medicine cabinet: the medicines and supplies the Owner's family has used. Shared by the API,
 * the console CRUD and the landing lookup page.
 *
 * Stub written by checklist row 5.1b (tests before code). Row 5.1c owns the final shape.
 */

export const MEDICAL_ITEM_KINDS = ['MEDICINE', 'SUPPLY'] as const;
export type MedicalItemKind = (typeof MEDICAL_ITEM_KINDS)[number];

export const MEDICINE_TIMINGS = ['BEFORE_MEAL', 'AFTER_MEAL', 'WITH_MEAL', 'ANY_TIME'] as const;
export type MedicineTiming = (typeof MEDICINE_TIMINGS)[number];

export const MEDICINE_USAGE_TYPES = ['LONG_TERM', 'COURSE'] as const;
export type MedicineUsageType = (typeof MEDICINE_USAGE_TYPES)[number];

export interface MedicalItemDto {
  id: string;
  profileId: string;
  kind: MedicalItemKind;
  name: string;
  activeIngredients: string[];
  strength: string | null;
  dose: string | null;
  timing: MedicineTiming | null;
  usageType: MedicineUsageType | null;
  purpose: string | null;
  note: string | null;
  packForTravel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HealthProfileDto {
  id: string;
  name: string;
  /** Items not deleted. */
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineLookupItem extends MedicalItemDto {
  profileName: string;
}
