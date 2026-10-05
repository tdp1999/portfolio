import { Marked } from 'marked';

const escapeHtml = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// `breaks`: the worker writes Facebook-style text where a single newline is a line break.
const markdown = new Marked({
  async: false,
  gfm: true,
  breaks: true,
  renderer: {
    // An image in worker-written markdown would load a third-party URL on open; show it as a link.
    image({ href, text }) {
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text || href)}</a>`;
    },
  },
});

/** Markdown to an untrusted HTML string; bind it through `[innerHTML]` so Angular sanitizes it. */
export function renderMarkdown(value: string): string {
  return markdown.parse(value) as string;
}
