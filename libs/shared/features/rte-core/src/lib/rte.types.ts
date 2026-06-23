import type { EditorDocument } from '@phuong-tran-redoc/document-engine-core';

// Re-export the canonical Tiptap-JSON document shape so every consumer (FE
// editor, FE renderer, BE write pipeline) depends only on this framework-free
// core, never on document-engine-core directly. Type-only — erased at compile
// time, so importing it never pulls the engine into a consumer's runtime.
export type { EditorDocument };

// Editing surface level. 'semantic' = restricted block set (headings/lists/quote);
// 'full' = adds the URL-free `image-ref` node. Drives which toolbar a concrete
// editor renders.
export type EditorMode = 'semantic' | 'full';
