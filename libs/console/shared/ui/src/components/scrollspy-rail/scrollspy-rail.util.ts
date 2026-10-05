import { STATUS_ICONS } from './scrollspy-rail.constants';
import type { SectionDescriptor, SectionView } from './scrollspy-rail.types';

/** Reads the section's status signal, so call it inside a `computed` to track status changes. */
export function toSectionView(section: SectionDescriptor): SectionView {
  const state = section.status ? section.status() : null;
  return { id: section.id, label: section.label, state, icon: state ? (STATUS_ICONS[state] ?? '○') : '' };
}
