import { InjectionToken } from '@angular/core';
import type { ImagePickHook, MediaResult } from '@phuong-tran-redoc/document-engine-angular';

// Re-export the engine's media-picker types so consumers wire the hook against a
// single contract surface and never import the engine package directly. These
// are the canonical types shipped by document-engine-angular (epic E-S1.4) — we
// deliberately reuse them rather than inventing a parallel `MediaPickerResult`.
export type { ImagePickHook, MediaResult };

/**
 * Hook a consumer provides to supply images from its own media library.
 *
 * In `'full'` mode the editor's image button calls this; resolving a
 * {@link MediaResult} inserts an `image-ref` node, resolving `null`/`undefined`
 * (or rejecting) is a cancel. Opaque here — the console wires it to the real
 * `MediaPickerDialog` (task 311). When no provider is registered, the editor
 * simply omits image insertion.
 */
export const MEDIA_PICKER_HOOK = new InjectionToken<ImagePickHook>('MEDIA_PICKER_HOOK');
