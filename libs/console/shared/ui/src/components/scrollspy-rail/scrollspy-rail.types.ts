import { Signal } from '@angular/core';

export type SectionStatus = 'untouched' | 'editing' | 'saved' | 'error';

export interface SectionDescriptor {
  id: string;
  label: string;
  status?: Signal<SectionStatus>;
}
