/**
 * Length of a text field as the Zod atoms count it: trim, NFC, then count. Console forms use this
 * so a form and the API agree on every boundary (EP + BVA table).
 */
export function textLength(value: string): number {
  return value.trim().normalize('NFC').length;
}
