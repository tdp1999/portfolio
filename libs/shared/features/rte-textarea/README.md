# rte-textarea

Plain-textarea concrete editor (`RteTextareaEditor`) satisfying the `RteEditor`
contract — a dependency-free fallback alongside `rte-tiptap`. It imports no editor
library, so it mounts in a jsdom unit test (or SSR) without the ProseMirror /
document-engine ESM tree, and can stand in for the lazy Tiptap chunk if it fails
to load.

It speaks the contract's `EditorDocument` directly: `writeValue` pretty-prints the
document into the textarea; on blur the text is parsed back (invalid JSON is
rejected, keeping the form's last valid value). Tests provide it under
`RTE_EDITOR` instead of the Tiptap impl.

## Running unit tests

Run `nx test rte-textarea` to execute the unit tests.
