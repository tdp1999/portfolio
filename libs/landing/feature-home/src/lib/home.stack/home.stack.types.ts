export type Run = { readonly text: string; readonly emphasis: 'plain' | 'bold' | 'italic' };
export type Paragraph = readonly Run[];
