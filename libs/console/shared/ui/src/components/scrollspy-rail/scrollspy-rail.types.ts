import { Signal } from '@angular/core';

export type SectionStatus = 'untouched' | 'editing' | 'saved' | 'error';

export interface SectionDescriptor {
  id: string;
  label: string;
  status?: Signal<SectionStatus>;
}

/** A section as the rail and tabs render it: its status read once, with the icon that shows it. */
export interface SectionView {
  id: string;
  label: string;
  /** Null when the section has no status signal: no icon is shown. */
  state: SectionStatus | null;
  icon: string;
}
