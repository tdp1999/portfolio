import type { PrimaryItem, SecondaryItem } from './ddl-mobile-nav.types';

export const PRIMARY_ITEMS: readonly PrimaryItem[] = [
  { label: 'Home', index: '01', active: true },
  { label: 'About', index: '02' },
  { label: 'Projects', index: '03' },
  { label: 'Blog', index: '04' },
];

export const SECONDARY_ITEMS: readonly SecondaryItem[] = [
  { label: 'Uses', hint: 'tools' },
  { label: 'Contact', hint: 'reach me' },
  { label: 'Colophon', hint: 'behind the build' },
  { label: 'DDL', hint: 'sandbox' },
];
