import type { SearchResult } from '../command-palette/command-palette.data';

export type Variant = 'v1' | 'v2' | 'v3' | 'v4' | null;

export interface FlatRow {
  readonly result: SearchResult;
  readonly groupHeader?: string;
}
