import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  template: `<div class="rte-content" [innerHTML]="html() | safeHtml"></div>`,
  styleUrl: './rte-render-html.scss',
})
export class RteRenderHtml {
  readonly html = input<string>('');
}
