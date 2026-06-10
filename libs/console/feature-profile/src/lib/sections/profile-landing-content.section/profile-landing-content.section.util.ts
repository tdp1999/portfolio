export function isEmpty(t: { en: string; vi: string }): boolean {
  return !t.en.trim() && !t.vi.trim();
}
