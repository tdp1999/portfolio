export type ToolEntry = {
  readonly monogram: string;
  readonly icon: string; // iconify slug (brand colour pre-baked)
  readonly lucide: string; // outline lucide name registered in icon provider
  readonly name: string;
  readonly reason: string;
  readonly href: string;
};

export type ToolCategory = {
  readonly num: string;
  readonly id: string;
  readonly title: string;
  readonly entries: readonly ToolEntry[];
};
