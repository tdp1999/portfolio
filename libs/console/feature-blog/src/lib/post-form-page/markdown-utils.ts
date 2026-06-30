/**
 * NOTE: Obsidian→Markdown conversion (`convertObsidianMarkdown`,
 * `extractTitleFromMarkdown`) moved to the BE importer module
 * (`apps/api/.../blog-post/import/obsidian-import.util.ts`) in task 318 — it is
 * the sole owner of the legacy Markdown→document path and must not ship to the
 * console runtime bundle. Only the preview renderer below remains here.
 */

/**
 * Basic markdown preview renderer. Lightweight; handles headings, code, images,
 * links, bold/italic, and paragraphs. This is for preview only — full rendering
 * happens server-side or in the public app.
 */
export function renderMarkdownPreview(markdown: string): string {
  if (!markdown) return '';
  let html = escapeHtml(markdown);

  // code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);

  // headings
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // bold / italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // blockquotes
  html = html.replace(/^>\s?(.+)$/gm, '<blockquote>$1</blockquote>');

  // paragraphs (double newlines)
  html = html
    .split(/\n{2,}/)
    .map((chunk) => {
      if (/^\s*<(h[1-6]|pre|blockquote|img|ul|ol|li)/i.test(chunk)) return chunk;
      return `<p>${chunk.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');

  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
