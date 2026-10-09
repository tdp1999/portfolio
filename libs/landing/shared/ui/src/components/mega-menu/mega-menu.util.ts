import type { MegaMenuColumn, MegaMenuSection } from './mega-menu.types';

let megaMenuSeq = 0;

export function nextMegaMenuId(): string {
  return (++megaMenuSeq).toString(36);
}

/**
 * Sections placed into grid columns. A section's column is its first item's `column`, or else its own
 * title, so sections sharing a `column` stack in one grid column; columns keep first-seen order.
 */
export function sectionColumnsOf(sections: readonly MegaMenuSection[]): readonly MegaMenuColumn[] {
  const columns = new Map<string | null, MegaMenuSection[]>();
  for (const section of sections) {
    const key = section.items[0]?.column ?? section.title;
    const bucket = columns.get(key);
    if (bucket) bucket.push(section);
    else columns.set(key, [section]);
  }
  return [...columns.entries()].map(([key, sections]) => ({ key, sections }));
}
