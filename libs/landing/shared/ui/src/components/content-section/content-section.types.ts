export type ContentEntry = {
  readonly name: string;
  readonly monogram: string;
  readonly reason: string;
  readonly href?: string;
};

export type ContentSectionData = {
  readonly num: string;
  readonly id: string;
  readonly title: string;
  readonly entries: readonly ContentEntry[];
};
