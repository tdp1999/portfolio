import type { COBEOptions, Globe as CobeGlobe } from 'cobe';

/**
 * `cobe` is ~30 KB and only needed once we're past `afterNextRender`. Importing
 * at module top level would land it in the initial bundle even though it isn't
 * used until the home Get-in-Touch section is in the DOM. Dynamic-import keeps it
 * in a separate lazy chunk so initial JS gzipped stays under the 150 KB budget.
 */
export type CreateGlobeFn = (canvas: HTMLCanvasElement, opts: COBEOptions) => CobeGlobe;

let createGlobePromise: Promise<CreateGlobeFn> | null = null;

export function loadCreateGlobe(): Promise<CreateGlobeFn> {
  if (!createGlobePromise) {
    createGlobePromise = import('cobe').then((m) => m.default as unknown as CreateGlobeFn);
  }
  return createGlobePromise;
}
