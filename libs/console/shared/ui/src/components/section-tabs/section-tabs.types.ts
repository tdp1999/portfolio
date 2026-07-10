import { SectionDescriptor } from '../scrollspy-rail/scrollspy-rail.types';

/**
 * A labelled cluster of section tabs in the vertical rail. Omit `label` (or pass
 * an empty string) for a flat, ungrouped list — the rail renders no group header.
 */
export interface SectionTabGroup {
  label?: string;
  sections: SectionDescriptor[];
}
