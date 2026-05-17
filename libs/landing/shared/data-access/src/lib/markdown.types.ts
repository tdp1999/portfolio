export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type RenderedMarkdown = {
  html: string;
  toc: TocEntry[];
};

export type MarkdownRenderOptions = {
  /** Absolute path that fragment links inside headings should resolve against
   *  (e.g. `/projects/console-mvp`). Without this, raw `href="#id"` resolves
   *  against `<base href="/">` and points at home + fragment. */
  basePath?: string;
};
