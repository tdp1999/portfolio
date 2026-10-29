import { IBaseAuditProps } from '@portfolio/shared/types';
import type { MedicalItemKind, MedicineTiming, MedicineUsageType } from '@portfolio/shared/types';

export interface IHealthProfileProps extends IBaseAuditProps {
  name: string;
}

export interface ICreateHealthProfilePayload {
  name: string;
}

export interface IMedicalItemProps extends IBaseAuditProps {
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
}

export type ICreateMedicalItemPayload = Omit<IMedicalItemProps, keyof IBaseAuditProps>;
export type IUpdateMedicalItemPayload = Partial<Omit<ICreateMedicalItemPayload, 'kind'>>;
