import type { DdlStatus } from './ddl.types';

// Standardized lifecycle marker — the headline of the docs convention. One chip,
// one meaning, everywhere: sidebar badge, page header, decision records.
export const STATUS_META: Record<DdlStatus, { label: string; ring: string; dot: string }> = {
  shipped: { label: 'Shipped', ring: 'border-landing-border text-landing-text-400', dot: 'bg-landing-text-400' },
  decided: { label: 'Decided', ring: 'border-landing-accent text-landing-accent', dot: 'bg-landing-accent' },
  exploring: { label: 'Exploring', ring: 'border-landing-border text-landing-text-500', dot: 'bg-landing-text-500' },
  deprecated: {
    label: 'Deprecated',
    ring: 'border-dashed border-landing-border text-landing-text-400',
    dot: 'bg-landing-text-400',
  },
};
