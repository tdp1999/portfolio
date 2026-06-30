import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ValidationError, BadRequestError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { ConvertMarkdownSchema, ConvertMarkdownResultDto } from '../blog-post.dto';
import { extractTitleFromMarkdown } from '../../import/obsidian-import.util';
import { markdownToEditorDocument } from '../../import/markdown-to-doc';

/**
 * Stateless Obsidian/Markdown → editor-JSON transform. A *query* (no DB write):
 * it converts the Markdown and returns the editor document + title + warnings so
 * the console can **prefill the editor**. Persistence, cover, and validation
 * happen later when the author Saves through the normal create flow.
 */
export class ConvertMarkdownQuery {
  constructor(readonly dto: unknown) {}
}

@QueryHandler(ConvertMarkdownQuery)
export class ConvertMarkdownHandler implements IQueryHandler<ConvertMarkdownQuery> {
  async execute(query: ConvertMarkdownQuery): Promise<ConvertMarkdownResultDto> {
    const { success, data, error } = ConvertMarkdownSchema.safeParse(query.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Convert markdown validation failed',
      });

    const title = data.title ?? extractTitleFromMarkdown(data.content);
    if (!title)
      throw BadRequestError('Markdown must contain an h1 heading or an explicit title', {
        errorCode: BlogPostErrorCode.CONTENT_REQUIRED,
        layer: ErrorLayer.APPLICATION,
      });

    const { doc, warnings } = await markdownToEditorDocument(data.content);
    return { title, contentJson: doc, warnings };
  }
}
