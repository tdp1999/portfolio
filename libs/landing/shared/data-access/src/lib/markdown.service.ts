import { Injectable } from '@angular/core';
import type { Renderer } from 'marked';
import type { BundledLanguage, SpecialLanguage } from 'shiki';
import type { MarkdownRenderOptions, RenderedMarkdown, TocEntry } from './markdown.types';
import { isSupportedLang, slugify, escAttr, decodeHtml } from './markdown.util';
import type { ConfiguredRenderer, MarkedModule, ShikiCodeToHtml } from './markdown.service.types';

/**
 * `marked` and `shiki` together weigh ~140 KB gzipped. They are only needed when
 * a route actually renders markdown (project-detail, blog-detail — both lazy).
 * Importing them at module top level would land in the initial bundle because
 * `@Injectable({ providedIn: 'root' })` is a side effect that esbuild cannot
 * tree-shake away even when no consumer injects this service. We cache the
 * dynamic-imported modules on the singleton service so each is fetched once.
 */

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private markedMod?: MarkedModule;
  private codeToHtmlFn?: ShikiCodeToHtml;

  async render(markdown: string, options: MarkdownRenderOptions = {}): Promise<RenderedMarkdown> {
    if (!markdown) return { html: '', toc: [] };

    const markedMod = await this.loadMarked();
    const { renderer, toc } = this.configureRenderer(markedMod, options);
    const parsed = await this.parse(markedMod, renderer, markdown);
    const html = await this.highlightCodeBlocks(parsed);

    return { html, toc };
  }

  private async loadMarked(): Promise<MarkedModule> {
    if (!this.markedMod) this.markedMod = await import('marked');
    return this.markedMod;
  }

  private async loadShikiCodeToHtml(): Promise<ShikiCodeToHtml> {
    if (!this.codeToHtmlFn) {
      const mod = await import('shiki');
      this.codeToHtmlFn = mod.codeToHtml;
    }
    return this.codeToHtmlFn;
  }

  private configureRenderer(markedMod: MarkedModule, options: MarkdownRenderOptions): ConfiguredRenderer {
    const basePath = options.basePath ?? '';
    const toc: TocEntry[] = [];
    const usedIds = new Set<string>();
    const renderer = new markedMod.Renderer();

    renderer.heading = ({ tokens, depth }) => {
      const text = tokens.map((t: { raw?: string; text?: string }) => t.text ?? t.raw ?? '').join('');
      let id = slugify(text) || `heading-${toc.length + 1}`;
      let suffix = 1;
      while (usedIds.has(id)) id = `${id}-${++suffix}`;
      usedIds.add(id);

      if (depth === 2 || depth === 3) {
        toc.push({ id, text, level: depth });
      }
      // Mirror the visual + UX contract of <landing-heading> (libs/landing/shared/ui heading
      // component) so markdown-rendered headings and Angular-rendered ones look identical.
      // Two anchors: the heading text itself is a fragment link, the trailing `#` is a hover-
      // revealed permalink. We emit absolute hrefs (basePath + fragment) so the browser's
      // status-bar preview shows the real destination — raw `href="#id"` would resolve against
      // <base href="/"> and read as `/#id` on hover even though SPA navigation lands correctly.
      // SPA interception lives in LandingProseAnchorsDirective.
      const linkClasses =
        'landing-heading__link text-inherit no-underline hover:text-landing-accent transition-colors duration-motion-base';
      const anchorClasses =
        'opacity-0 group-hover/heading:opacity-100 text-landing-text-500 hover:text-landing-accent ' +
        'transition-opacity duration-motion-base font-mono text-body-md no-underline ml-2';
      const href = escAttr(`${basePath}#${id}`);
      const safeId = escAttr(id);
      return (
        `<h${depth} id="${safeId}" class="group/heading scroll-mt-20">` +
        `<a class="${linkClasses}" href="${href}">${text}</a>` +
        `<a class="${anchorClasses}" href="${href}" aria-label="Anchor link to ${safeId}" title="Copy link to this section">#</a>` +
        `</h${depth}>\n`
      );
    };

    renderer.link = ({ href, title, tokens }) => {
      const text = tokens.map((t: { raw?: string; text?: string }) => t.text ?? t.raw ?? '').join('');
      const isExternal = /^https?:\/\//i.test(href);
      const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${escAttr(title)}"` : '';
      return `<a href="${escAttr(href)}"${titleAttr}${attrs}>${text}</a>`;
    };

    renderer.image = ({ href, title, text }) => {
      const alt = text ?? '';
      const captionText = title || alt;
      const titleAttr = title ? ` title="${escAttr(title)}"` : '';
      // The frame reserves a 16:9 box from initial paint so anchorScrolling lands the right place
      // even before images load. Placeholder sits underneath (always rendered); the <img> overlays
      // it with opacity 0 → 1 on successful load, or hides itself onerror so the placeholder is
      // revealed. Result: identical layout dimensions across loading / loaded / broken states,
      // zero reflow when images finish loading. Markdown is repo-controlled so inline handlers
      // are trusted.
      const onLoad = `this.classList.add('is-loaded')`;
      const onErr = `this.style.display='none'`;
      return (
        `<figure class="landing-figure">` +
        `<div class="landing-figure__frame">` +
        `<span class="landing-figure__placeholder" aria-hidden="true">` +
        `<span class="landing-figure__placeholder-label">image pending</span>` +
        `</span>` +
        `<img src="${escAttr(href)}" alt="${escAttr(alt)}"${titleAttr} loading="lazy" onload="${onLoad}" onerror="${onErr}" />` +
        `</div>` +
        (captionText ? `<figcaption>${captionText}</figcaption>` : '') +
        `</figure>`
      );
    };

    return { renderer, toc };
  }

  private async parse(markedMod: MarkedModule, renderer: Renderer, markdown: string): Promise<string> {
    // `new Marked()` creates an isolated instance so concurrent renders (e.g. parallel
    // SSR requests) don't race on the global `marked` singleton's renderer state.
    // Using the singleton's `marked.use({ renderer })` would let one request's renderer
    // overwrite another's mid-parse.
    const instance = new markedMod.Marked({ renderer, async: true });
    return instance.parse(markdown, { async: true });
  }

  private async highlightCodeBlocks(html: string): Promise<string> {
    const codeBlockRegex = /<pre><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g;
    const matches = Array.from(html.matchAll(codeBlockRegex));
    if (matches.length === 0) return html;

    const codeToHtml = await this.loadShikiCodeToHtml();
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
