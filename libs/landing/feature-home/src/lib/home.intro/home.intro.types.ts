export type Run = { readonly text: string; readonly italic: boolean };
export type Paragraph = readonly Run[];

export interface PenAnchor {
  readonly x: number;
  readonly y: number;
}
