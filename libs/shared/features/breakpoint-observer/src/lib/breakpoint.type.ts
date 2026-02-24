export type BreakpointConfig = Record<string, string>;

export interface BreakpointState {
  name: string;
  mediaQuery: string;
  isActive: boolean;
}
