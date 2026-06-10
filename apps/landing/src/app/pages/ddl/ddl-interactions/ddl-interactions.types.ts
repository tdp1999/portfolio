export type Scope = 'whole-landing' | 'home' | 'project-detail';
export type Effort = 'S' | 'M' | 'L';
export type DemoKind = 'live' | 'descriptive';

export interface WishlistItem {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly scope: Scope;
  readonly effort: Effort;
  readonly demoKind: DemoKind;
}

export interface WishlistGroup {
  readonly category: string;
  readonly description: string;
  readonly items: readonly WishlistItem[];
}
