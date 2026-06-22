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
  /** Stable id for the trigger group — drives the section anchor + right-hand TOC entry. */
  readonly anchor: string;
  readonly category: string;
  readonly description: string;
  readonly items: readonly WishlistItem[];
}
