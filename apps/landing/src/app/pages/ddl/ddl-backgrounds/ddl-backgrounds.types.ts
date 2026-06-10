import type { LandingBackgroundPattern } from '@portfolio/landing/shared/ui';

export type PatternEntry = {
  id: LandingBackgroundPattern;
  label: string;
  hint: string;
  useCase: string;
  bestFor: readonly string[];
  avoidFor: readonly string[];
  sampleHeadline: string;
  sampleTagline: string;
};
