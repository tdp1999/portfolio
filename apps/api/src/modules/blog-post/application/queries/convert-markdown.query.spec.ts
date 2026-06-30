// The Markdown→editor-JSON engine pulls ESM-only `marked` + the document-engine
// schema (jsdom-backed Tiptap server serializer), which the api jest transformer
// won't process. Mock it so this spec exercises the query handler's orchestration;
// the real conversion is covered by the api-e2e convert-markdown spec.
jest.mock('../../import/markdown-to-doc', () => ({
  markdownToEditorDocument: jest.fn(),
}));

import { ConvertMarkdownQuery, ConvertMarkdownHandler } from './convert-markdown.query';
import { markdownToEditorDocument } from '../../import/markdown-to-doc';

describe('ConvertMarkdownHandler', () => {
  const convert = markdownToEditorDocument as jest.Mock;
  const handler = new ConvertMarkdownHandler();
  const doc = { schemaVersion: 1, content: { type: 'doc', content: [] } };

  beforeEach(() => {
    convert.mockReset();
    convert.mockResolvedValue({ doc, warnings: [] });
  });

  it('extracts the h1 title and returns the converted doc + warnings', async () => {
    const res = await handler.execute(new ConvertMarkdownQuery({ content: '# Hello\n\nbody' }));
    expect(convert).toHaveBeenCalledWith('# Hello\n\nbody');
    expect(res).toEqual({ title: 'Hello', contentJson: doc, warnings: [] });
  });

  it('prefers an explicit title over the h1', async () => {
    const res = await handler.execute(new ConvertMarkdownQuery({ content: '# H1\n\nx', title: 'Explicit' }));
    expect(res.title).toBe('Explicit');
  });

  it('passes converter warnings through unchanged', async () => {
    convert.mockResolvedValue({ doc, warnings: ['2 images skipped — re-insert them with the image button.'] });
    const res = await handler.execute(new ConvertMarkdownQuery({ content: '# H\n\n![[a]]' }));
    expect(res.warnings).toEqual(['2 images skipped — re-insert them with the image button.']);
  });

  it('throws when there is no h1 and no explicit title', async () => {
    await expect(handler.execute(new ConvertMarkdownQuery({ content: 'no heading body' }))).rejects.toThrow();
    expect(convert).not.toHaveBeenCalled();
  });

  it('throws on empty content (schema validation)', async () => {
    await expect(handler.execute(new ConvertMarkdownQuery({ content: '' }))).rejects.toThrow();
  });
});
