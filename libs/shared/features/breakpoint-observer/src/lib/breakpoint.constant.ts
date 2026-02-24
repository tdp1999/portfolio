import { BreakpointConfig } from './breakpoint.type';

export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: '(max-width: 767.98px)',
  tablet: '(min-width: 768px) and (max-width: 1023.98px)',
  desktop: '(min-width: 1024px)',
} as const;
