export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type RenderedMarkdown = {
  html: string;
  toc: TocEntry[];
};
