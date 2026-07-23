import { InjectionToken } from '@angular/core';
import type { DocumentEngineConfig, ImagePickHook, MediaResult } from '@phuong-tran-redoc/document-engine-angular';

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

/**
 * Optional per-injector overrides layered on top of the mode config.
 *
 * The built-in modes (`semantic` / `full` / `list`) describe what *portfolio
 * content* is allowed to be, and they deliberately switch off the engine's
 * business features — dynamic fields, tables, restricted editing — because
 * nothing published on this site uses them.
 *
 * Some consumers legitimately need a different engine. The Document Engine
 * product page is one: it exists to demonstrate exactly those features, so a
 * config that hides them would make the page dishonest. Rather than fork the
 * editor component, such a consumer provides this token and gets the same
 * component running a different engine — which is the whole claim the
 * `type:rte-impl` boundary is making.
 *
 * Overrides win over the mode config, but never over the runtime state the
 * component owns (`editable`, `placeholder`, the media hook).
 */
export const RTE_ENGINE_CONFIG_OVERRIDES = new InjectionToken<Partial<DocumentEngineConfig>>(
  'RTE_ENGINE_CONFIG_OVERRIDES'
);
