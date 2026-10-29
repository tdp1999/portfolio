import { normalizeForSearch } from './search-normalize.util';

// AC-4 · 'P11 Khớp một phần' (SR-007): case-insensitive, accent-insensitive, and "đ" counts as "d".
describe('normalizeForSearch', () => {
  it('P11: turns "Đường" into "duong" (the slug helper drops "đ", this one must not)', () => {
    expect(normalizeForSearch('Đường')).toBe('duong');
  });

  it('P11: removes Vietnamese accents ("thuốc dạ dày" → "thuoc da day")', () => {
    expect(normalizeForSearch('thuốc dạ dày')).toBe('thuoc da day');
  });

  it('P11: ignores letter case ("SIMETHICONE" → "simethicone")', () => {
    expect(normalizeForSearch('SIMETHICONE')).toBe('simethicone');
  });

  it('P11: treats a lowercase "đ" like "d" ("đau dạ dày" → "dau da day")', () => {
    expect(normalizeForSearch('đau dạ dày')).toBe('dau da day');
  });
});
