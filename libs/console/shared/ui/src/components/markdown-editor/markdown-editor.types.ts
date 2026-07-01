/**
 * Stable, implementation-agnostic contract for the markdown editor.
 *
 * The current implementation is a plain `<textarea>` placeholder. It will be
 * swapped for a ProseMirror-based editor (`document-engine`) without changing
 * this contract — consumers depend only on the symbols exported here.
 */

/**
 * Public imperative API any markdown editor implementation must expose.
 * Mirrors the acceptance criteria of task 243 so the textarea placeholder
 * and the future ProseMirror wrapper are interchangeable.
 */
export interface MarkdownEditorApi {
  /** Replace the editor's current content with `markdown`. */
  setContent(markdown: string): void;
  /** Read the editor's current content as a markdown string. */
  getContent(): string;
}

/** Payload emitted whenever the editor content changes. */
export interface MarkdownEditorChange {
  markdown: string;
}
