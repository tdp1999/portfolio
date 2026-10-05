import { Pipe, PipeTransform } from '@angular/core';
import { renderMarkdown } from './markdown.util';

/**
 * Markdown to an HTML string for `[innerHTML]`. The worker writes these fields, so the output is
 * not trusted: binding through `[innerHTML]` keeps Angular's sanitizer on it. Never pair this
 * pipe with `bypassSecurityTrustHtml`.
 */
@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? renderMarkdown(value) : '';
  }
}
