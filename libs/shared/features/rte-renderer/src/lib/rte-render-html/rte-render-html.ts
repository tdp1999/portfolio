import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  RICH_TEXT_MEDIA_WHITELIST,
  RICH_TEXT_WHITELIST,
  type RichTextWhitelist,
} from '@portfolio/shared/features/rte-core/constants';
import { SafeHtmlPipe } from '../safe-html.pipe';

/**
 * SSR-safe read-side renderer for pre-sanitized rich-text HTML.
 *
 * The only sanctioned surface for binding rich-text HTML on landing. Consumes
 * the `*Html` cache produced by the BE write pipeline and applies a second
 * DOMPurify pass via {@link SafeHtmlPipe} (belt-and-braces). Loads no Tiptap and
 * holds no editor dependency.
 *
 * Named `*-html` because it renders an HTML *string*. The prose-block epic later
 * adds a sibling AST renderer (`<rte-render [doc]>`) that walks the canonical
 * node tree declaratively; this one survives as the cache-fallback path
 * (RSS / llms.txt / OG / no-JS).
 */
@Component({
  selector: 'rte-render-html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SafeHtmlPipe],
  template: `<div
    [class]="('rte-content ' + contentClass()).trim()"
    [innerHTML]="html() | safeHtml: whitelist()"
  ></div>`,
  styleUrl: './rte-render-html.scss',
})
export class RteRenderHtml {
  readonly html = input<string>('');

  /**
   * Opt in to rendering hydrated `image-ref` images (task 315).
   *
   * The stored HTML cache is URL-free; a landing consumer that resolves
   * `data-image-id` → media URL and injects `<img>` (via `hydrateImageRefs`) must
   * set this so the renderer's browser-side re-sanitize keeps that `<img>` instead
   * of stripping it. Off by default — text-only surfaces stay on the strict base
   * whitelist with no `<img>` allowed.
   */
  readonly allowMedia = input<boolean>(false);

  protected readonly whitelist = computed<RichTextWhitelist>(() =>
    this.allowMedia() ? RICH_TEXT_MEDIA_WHITELIST : RICH_TEXT_WHITELIST
  );

  /**
   * Extra class(es) applied to the content `<div>` alongside `rte-content`.
   *
   * The rendered `<p>`/`<h2>`/`<ul>`… are direct children of this div, so a
   * consumer whose prose styles use direct-child selectors (e.g. landing's
   * `.landing-prose > h2` vertical rhythm in `_prose.scss`) must land that class
   * on this same div — not on a wrapper — or the rhythm selectors won't match.
   * Pass `contentClass="landing-prose"` to do exactly that.
   */
  readonly contentClass = input<string>('');
}
