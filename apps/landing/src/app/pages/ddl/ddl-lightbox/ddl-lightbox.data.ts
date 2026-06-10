import type { Shot } from './ddl-lightbox.types';

export const GALLERY: readonly Shot[] = [
  {
    url: 'https://placehold.co/1200x900/1a2030/e2e8f0.png?text=01',
    alt: 'Permissions console overview',
    caption: 'Permissions console — role × resource matrix with inherited scopes.',
  },
  {
    url: 'https://placehold.co/1200x900/11151c/cbd5e1.png?text=02',
    alt: 'Loan document engine editor',
    caption: 'Document engine — block editor composing a loan contract template.',
  },
  {
    url: 'https://placehold.co/1200x900/1a2030/94a3b8.png?text=03',
    alt: 'Loan ops dashboard',
    caption: 'Ops dashboard — pipeline health and approval queue at a glance.',
  },
  {
    url: 'https://placehold.co/1200x900/11151c/64748b.png?text=04',
    alt: 'Mobile approval flow',
    caption: 'Mobile approval — one-tap sign-off on the go, audit trail attached.',
  },
];

export const SOLO: Shot = {
  url: 'https://placehold.co/1600x1000/0b0e14/cbd5e1.png?text=Solo',
  alt: 'Standalone diagram',
  caption: 'A standalone figure — opens on its own with no prev/next.',
};
