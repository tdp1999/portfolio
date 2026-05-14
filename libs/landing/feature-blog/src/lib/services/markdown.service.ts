import { Injectable } from '@angular/core';
import { marked, type Renderer } from 'marked';
import { codeToHtml, type BundledLanguage, type SpecialLanguage } from 'shiki';
import type { RenderedMarkdown, TocEntry } from './markdown.types';

const SUPPORTED_LANGS = new Set<BundledLanguage>([
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'python',
  'go',
  'sql',
  'css',
  'html',
  'bash',
  'shell',
  'json',
  'yaml',
  'markdown',
]);

function isSupportedLang(value: string | undefined): value is BundledLanguage {
  return value !== undefined && SUPPORTED_LANGS.has(value as BundledLanguage);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

type ConfiguredRenderer = { renderer: Renderer; toc: TocEntry[] };

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  async render(markdown: string): Promise<RenderedMarkdown> {
    if (!markdown) return { html: '', toc: [] };

    const { renderer, toc } = this.configureRenderer();
    const parsed = await this.parse(markdown, renderer);
    const html = await this.highlightCodeBlocks(parsed);

    return { html, toc };
  }

  private configureRenderer(): ConfiguredRenderer {
    const toc: TocEntry[] = [];
    const usedIds = new Set<string>();
    const renderer = new marked.Renderer();

    renderer.heading = ({ tokens, depth }) => {
      const text = tokens.map((t: { raw?: string; text?: string }) => t.text ?? t.raw ?? '').join('');
      let id = slugify(text) || `heading-${toc.length + 1}`;
      let suffix = 1;
      while (usedIds.has(id)) id = `${id}-${++suffix}`;
      usedIds.add(id);

      if (depth === 2 || depth === 3) {
        toc.push({ id, text, level: depth });
      }
      return `<h${depth} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="Link to ${text}">#</a>${text}</h${depth}>\n`;
    };

    renderer.link = ({ href, title, tokens }) => {
      const text = tokens.map((t: { raw?: string; text?: string }) => t.text ?? t.raw ?? '').join('');
      const isExternal = /^https?:\/\//i.test(href);
      const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr}${attrs}>${text}</a>`;
    };

    renderer.image = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${text ?? ''}"${titleAttr} loading="lazy" />`;
    };

    return { renderer, toc };
  }

  private async parse(markdown: string, renderer: Renderer): Promise<string> {
    marked.use({ renderer, async: true });
    return marked.parse(markdown, { async: true });
  }

  private async highlightCodeBlocks(html: string): Promise<string> {
    const codeBlockRegex = /<pre><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g;
    const matches = Array.from(html.matchAll(codeBlockRegex));

    let result = html;
    for (const match of matches) {
      const [full, lang, rawCode] = match;
      const code = decodeHtml(rawCode);
      const language: BundledLanguage | SpecialLanguage = isSupportedLang(lang) ? lang : 'text';
      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });
        result = result.replace(full, highlighted);
      } catch {
        // leave original block if highlighting fails
      }
    }
    return result;
  }
}

function decodeHtml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
