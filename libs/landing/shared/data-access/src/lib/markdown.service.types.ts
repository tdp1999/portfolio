import type { Renderer } from 'marked';
import type { codeToHtml as CodeToHtml } from 'shiki';
import type { TocEntry } from './markdown.types';

export type MarkedModule = typeof import('marked');
export type ShikiCodeToHtml = typeof CodeToHtml;
export type ConfiguredRenderer = { renderer: Renderer; toc: TocEntry[] };
