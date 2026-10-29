import { IUpdateMedicalItemPayload } from '../../domain/medicine-cabinet.types';
import { UpdateMedicalItemDto } from '../medical-item.dto';

/** An optional text field left empty is stored as `null`, so the lookup page shows it as not filled in. */
export const emptyToNull = (value: string | null | undefined): string | null => (value ? value : null);

const OPTIONAL_TEXT_FIELDS = ['dose', 'purpose', 'note'] as const;

/** Keeps only the keys the PATCH sent, with empty optional text turned into `null`. */
export function toUpdatePayload(dto: UpdateMedicalItemDto): IUpdateMedicalItemPayload {
  const { kind: _kind, ...rest } = dto;
  const payload: IUpdateMedicalItemPayload = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined)
  );
  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (field in payload) payload[field] = emptyToNull(payload[field]);
  }
  return payload;
}
