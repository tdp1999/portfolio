import type { BrandConfig } from './brand.types';

/**
 * The canonical tdp Brand — the human-authored "main idea" the whole system
 * derives from. Other products can declare their own BrandConfig (per-project)
 * and reuse the same components/generator.
 */
export const TDP_BRAND: BrandConfig = {
  name: 'tdp',
  monogram: 'tdp.',
  wordmark: 'Phuong Tran',
  theme: {
    accent: '#6E66D9',
    mode: 'dark',
  },
};
