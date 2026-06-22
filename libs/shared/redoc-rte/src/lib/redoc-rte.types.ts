import type { EditorDocument } from '@phuong-tran-redoc/document-engine-core';

// Re-export the canonical Tiptap-JSON document shape so consumers depend only on
// this contract lib, never on document-engine-core directly.
export type { EditorDocument };

// Editing surface level. 'semantic' = restricted block set (headings/lists/quote);
// 'full' = adds tables, media, and advanced marks. Drives which toolbar a concrete
// editor renders.
export type EditorMode = 'semantic' | 'full';
