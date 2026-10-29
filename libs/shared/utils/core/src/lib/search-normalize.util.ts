/**
 * Normalizes a string for accent- and case-insensitive search (SR-007): lowercase, NFD, drop
 * combining marks, then map "đ" to "d". The slug helper drops "đ", so search keeps its own helper.
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
