import { Injectable } from '@angular/core';
import { marked } from 'marked';
import { codeToHtml, type BundledLanguage } from 'shiki';

export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type RenderedMarkdown = {
  html: string;
  toc: TocEntry[];
};

const SUPPORTED_LANGS: BundledLanguage[] = [
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
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  async render(markdown: string): Promise<RenderedMarkdown> {
    if (!markdown) return { html: '', toc: [] };

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

    marked.use({ renderer, async: true });

    // Pre-render to get HTML, then post-process code blocks via shiki.
    let html = await marked.parse(markdown, { async: true });

    // Replace <pre><code class="language-xxx">...</code></pre> with shiki output.
    const codeBlockRegex = /<pre><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g;
    const matches = Array.from(html.matchAll(codeBlockRegex));

    for (const match of matches) {
      const [full, lang, rawCode] = match;
      const code = decodeHtml(rawCode);
      const language = (SUPPORTED_LANGS.includes(lang as BundledLanguage) ? lang : 'text') as BundledLanguage;
      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });
        html = html.replace(full, highlighted);
      } catch {
        // leave original block if highlighting fails
      }
    }

    return { html, toc };
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
