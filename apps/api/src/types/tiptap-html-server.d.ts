// Ambient declaration for the Node-only `@tiptap/html/server` subpath. The api
// tsconfig uses `moduleResolution: node` (node10), which predates `exports` maps
// and cannot resolve subpath exports, so a bare `import('@tiptap/html/server')`
// would otherwise fail type resolution. This shim declares the single symbol we
// use; webpack (Node target, externalize-all) resolves the real module at runtime.
declare module '@tiptap/html/server' {
  import type { Extensions, JSONContent } from '@tiptap/core';
  export function generateJSON(html: string, extensions: Extensions): JSONContent;
}
