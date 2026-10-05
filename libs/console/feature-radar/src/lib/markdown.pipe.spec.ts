import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('renders bold and single-newline breaks', () => {
    expect(pipe.transform('**a**\nb')).toBe('<p><strong>a</strong><br>b</p>\n');
  });

  it('turns an image into a link instead of loading it', () => {
    const html = pipe.transform('![chart](https://x.test/a.png)');
    expect(html).not.toContain('<img');
    expect(html).toContain('<a href="https://x.test/a.png" target="_blank" rel="noopener noreferrer">chart</a>');
  });

  it('returns an empty string for no value', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
