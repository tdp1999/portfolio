import type { MegaMenuSection } from './mega-menu.types';
import { sectionColumnsOf } from './mega-menu.util';

const section = (title: string | null, column?: string): MegaMenuSection => ({
  title,
  items: [{ label: `${title} item`, href: '/x', column }],
});

describe('sectionColumnsOf', () => {
  it('should give each section its own column when none share a column key', () => {
    const columns = sectionColumnsOf([section('Explore'), section('Documents')]);

    expect(columns.map((c) => c.sections.map((s) => s.title))).toEqual([['Explore'], ['Documents']]);
  });

  it('should stack sections sharing a column key in first-seen order', () => {
    const columns = sectionColumnsOf([
      section('Explore'),
      section('Documents', 'documents'),
      section('Account', 'documents'),
    ]);

    expect(columns.map((c) => c.key)).toEqual(['Explore', 'documents']);
    expect(columns[1].sections.map((s) => s.title)).toEqual(['Documents', 'Account']);
  });
});
