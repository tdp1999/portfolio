import { keepFirstRow, pageSlots } from './paginator.util';

/** The strip as text: page numbers 1-based, the current page in brackets, an ellipsis as `...`. */
const strip = (pageCount: number, current: number) =>
  pageSlots(pageCount, current)
    .map((s) => (s.kind === 'gap' ? '...' : s.current ? `[${s.label}]` : s.label))
    .join(' ');

describe('pageSlots', () => {
  it('should list every page when they all fit', () => {
    expect(strip(1, 0)).toBe('[1]');
    expect(strip(9, 4)).toBe('1 2 3 4 [5] 6 7 8 9');
  });

  it('should keep the first and last page, two siblings each side, and an ellipsis per hidden run', () => {
    expect(strip(18, 9)).toBe('1 ... 8 9 [10] 11 12 ... 18');
  });

  it('should keep the same number of slots at both edges instead of shrinking', () => {
    expect(strip(18, 0)).toBe('[1] 2 3 4 5 6 7 ... 18');
    expect(strip(18, 4)).toBe('1 2 3 4 [5] 6 7 ... 18');
    expect(strip(18, 17)).toBe('1 ... 12 13 14 15 16 17 [18]');
  });

  it('should make each ellipsis jump five pages, clamped to the ends', () => {
    const gaps = pageSlots(100, 49).filter((s) => s.kind === 'gap');
    expect(gaps.map((g) => g.kind === 'gap' && g.target)).toEqual([44, 54]);

    const nearEnd = pageSlots(100, 97).filter((s) => s.kind === 'gap');
    expect(nearEnd.map((g) => g.kind === 'gap' && g.target)).toEqual([92]);
  });
});

describe('keepFirstRow', () => {
  it('should land on the page that holds the first row seen before the size change', () => {
    // Rows 101-150 at 50 per page; at 20 per page row 101 is on page 6 (index 5).
    expect(keepFirstRow(2, 50, 20)).toBe(5);
    // Rows 401-420 at 20 per page; at 200 per page they are on page 3 (index 2).
    expect(keepFirstRow(20, 20, 200)).toBe(2);
  });
});
