import type { TimezoneOption } from './timezone-data';

export type TimezoneValue = string | string[] | null;

export interface RenderedZone extends TimezoneOption {
  label: string;
  offset: string;
}

export interface RenderedGroup {
  region: string;
  zones: RenderedZone[];
}
