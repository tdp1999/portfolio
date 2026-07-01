# Epic: Prose Block Renderer (`redoc-blocks`)

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: **complete (2026-07-01)** — implemented directly from this epic (no task breakdown), all 6 phases shipped. Two-gate protocol per phase. See ADR-022 for the load-bearing decisions.
> Depends on: [`epic-portfolio-rich-text-editor`](./epic-portfolio-rich-text-editor.md) (complete — this epic consumes its JSON canonical + write pipeline).
> Supersedes: RTE epic **Phase 6 + Phase 7 read-path** (the `[innerHTML]` HTML-cache + `data-block` hydration approach). That approach is now the **fallback** (D7) behind the AST canonical path — retained, not deleted, until all stored content carries `bodyCanonical`/`contentCanonical`.

## Why this exists

The RTE epic stores rich content as **JSON AST canonical + sanitized HTML cache** and renders the landing read-path via `[innerHTML]="contentHtml"` plus a directive that scans `[data-block="image-ref"]` and mounts a component. That islands-hydration approach is correct for **one** block type. It does not scale to a CMS-like model where the author composes **many** custom blocks — each with its own UI _and its own logic_ — the way WordPress/Gutenberg plugins register block types.

The mental shift: **content is a structured node tree, not HTML.** HTML is one serialization. To get live, logic-bearing components in prose we render the **AST directly into an Angular component tree via a registry**, instead of hydrating dead HTML. This is the Gutenberg/Portable-Text model (a `nodeType → renderer` registry with an unknown-block fallback), adapted to Angular SSR.

Locked via design Q&A drill 2026-06-03 (this conversation).

## Decisions (locked 2026-06-03)

### D1 — Landing read-path source of truth = JSON AST (not HTML cache)

The landing read-path renders from the canonical JSON document, walked node-by-node. The `*Html` cache is **demoted to a fallback** (see D7). Angular SSR renders the AST to real HTML server-side, so crawlers/SEO are served by SSR itself — not by the cache.

### D2 — Canonical contract owned by us, decoupled from `document-engine` (E)

Landing never reads E's (Tiptap) JSON shape directly. We define our own stable contract: the `PortableNode`/`PortableDocument` types + per-block Zod attr schemas go into the Angular-free `rte-core` lib (so the BE can import the Zod schemas + types at runtime without bundling Angular), while the Angular DI bits (`BLOCK_RENDERERS` token, `provideBlockRenderers`) stay in `rte-contract` (the existing RTE contract lib):

```ts
export interface PortableNode {
  type: string; // OUR node type (e.g. 'paragraph', 'gallery')
  attrs?: Record<string, unknown>; // Zod-validated
  marks?: Mark[]; // text nodes only
  text?: string; // text nodes
  content?: PortableNode[];
}
export interface PortableDocument {
  schemaVersion: number;
  content: PortableNode[];
}
```

The envelope mirrors ProseMirror, but **node names + attrs are ours**. `schemaVersion` is **our** version, independent of E's. This is the answer to the "E schema may change" concern (#6): the only coupling lives in one adapter (D3); everything downstream keys on our stable types.

### D3 — Anti-corruption adapter at BE write-time

When the admin saves, the BE normalizes E's JSON → `PortableDocument` and stores **that** as `contentJson`. The adapter is the single boundary that knows E's node names/attrs.

```
E (Tiptap JSON)  ──adapter (BE write-time)──▶  PortableDocument (canonical)  ──▶  DB contentJson
```

If E renames a node or changes an attr key, **only the adapter + a migration change.** Registry, renderer, and block components are untouched. (This refines RTE Phase 4's `RichTextService.toCanonicalForm` — that service now also runs the E→canonical normalization, not just `generateHTML` + sanitize.)

### D4 — Block renderer registry + conditional injection (`NgComponentOutlet`)

Blocks are registered via a DI multi-provider token — adding a block = adding one entry (the "plugin" experience):

```ts
export interface BlockRenderer<I = Record<string, unknown>> {
  type: string; // matches PortableNode.type
  component: Type<unknown>;
  inputs: (node: PortableNode, ctx: RenderContext) => I; // node.attrs → @Input()s
}
export const BLOCK_RENDERERS = new InjectionToken<readonly BlockRenderer[]>('BLOCK_RENDERERS');
```

The renderer walks the tree and injects conditionally — declaratively, so Angular SSR + (incremental) hydration handle it natively, with no manual `createComponent` after `innerHTML`:

```html
@let r = rendererFor(node.type); @if (r) {
<ng-container *ngComponentOutlet="r.component; inputs: r.inputs(node, ctx)" />
} @else if (node.text != null) {
<rte-inline [node]="node" />
<!-- D5 -->
} @else {
<rte-element [node]="node" />
<!-- recursive p/h2/ul/... -->
}
```

`rendererFor(type)` returns `undefined` → fallback (skip or a "missing block" placeholder), mirroring how Gutenberg handles unknown blocks.

### D5 — Editor ↔ component contract anchored by Zod attr schemas

Three artifacts must agree; the **Zod schema is the stable anchor between them** (project already uses Zod v4):

1. **Contract** (`rte-core` — node `type` + `z.object(...)` attr schema, Angular-free so the BE can import it): the source of truth.
2. **Editor (E) produces it**: the D3 adapter maps E's node → `{ type, attrs }` then `Schema.parse(attrs)` — invalid attrs are dropped (this is also the primary security gate, D6).
3. **Component consumes it**: the registry's `inputs(node, ctx)` maps validated attrs → the component's typed `input()`s.

Change is safe in any of the three as long as all conform to the schema. Block components are **thin wrappers over existing landing primitives** wherever possible (e.g. a `gallery` block wraps the lightbox-enabled `landing-gallery`).

### D6 — Security model = whitelist the tree, not a string

Replaces the `ALLOWED_TAGS`/DOMPurify-string model for the AST path:

- **Write-time (BE), primary gate:** the adapter whitelists node `type` + Zod-validates attrs; unknown nodes/attrs dropped. URLs checked for `https?:` (block `javascript:`).
- **Read-time:** the registry renders only known types; unknown → ignored. Rendering is **declarative** (incl. inline marks, D5 below → no `innerHTML`), so Angular's built-in binding sanitization covers the known sinks (`href`, etc.).

The XSS surface of "arbitrary HTML string" disappears. (The HTML-cache fallback path, D7, still runs DOMPurify — it is the only `[innerHTML]` left.)

### D5b — Inline marks rendered declaratively (no `innerHTML`)

Text-node marks (bold/italic/link/code/u/s) are rendered as nested real elements (`<strong><em><a …>`), not as an injected HTML string. Keeps the read-path 100% `innerHTML`-free and makes D6 trivially strong. Link marks force `target="_blank" rel="noopener nofollow"`.

### D7 — HTML cache demoted to fallback (SEO is covered by SSR)

Angular SSR emits full HTML from the AST renderer, so Googlebot / AI crawlers get complete content without JS — **SEO/crawlability is served by SSR**, not the cache. Keep `contentHtml` cache as a fallback for **non-Angular consumers**: RSS, `llms.txt` (task 323), OG snippets, and no-JS safety. This is the only surviving `[innerHTML] | safeHtml` binding.

## Library boundary changes

| Lib                                | Change                                                                                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/shared/features/rte-core` (Angular-free) | **Add** `PortableDocument`/`PortableNode`/`Mark` types and per-block Zod attr schemas — so the BE can import the Zod schemas + types at runtime without bundling Angular.                                                                            |
| `libs/shared/features/rte-contract` (contract) | **Add** the Angular DI bits: `BlockRenderer`, `BLOCK_RENDERERS` token, `provideBlockRenderers()`, `RenderContext`.                                                                            |
| `libs/shared/features/rte-renderer`   | **Rewrite** read-path from "innerHTML + DOMPurify" to an **AST walker + `NgComponentOutlet`** (`<rte-render [doc]="...">`). Keep a separate `<rte-render-html [html]="...">` for the cache-fallback consumers (RSS/llms.txt/OG/no-JS). |
| BE `RichTextService` (RTE Phase 4) | **Extend** `toCanonicalForm` to run the E→canonical adapter (D3) before HTML generation; persist canonical JSON.                                                                                                                                   |
| Block component libs               | New thin wrappers (e.g. `FigureBlockComponent`, `GalleryBlockComponent`) over existing `landing-figure` / `landing-gallery` primitives.                                                                                                            |

## Phases (all shipped 2026-07-01)

1. ✅ **Contract** — `PortableDocument`/`PortableNode`/`Mark` types + Zod attr schemas (`paragraph`/`heading`/`image-ref`, later `gallery`) in `rte-core` (Angular-free, deep alias `rte-core/portable`); `BlockRenderer`/`BLOCK_RENDERERS`/`provideBlockRenderers`, `RenderContext` in `rte-contract`.
2. ✅ **E→canonical adapter** — anti-corruption mapper (`rich-text.adapter.ts`) + Zod validation in `RichTextService` (BE write-time); `bodyCanonical`/`contentCanonical` columns added (migration `add_prose_block_canonical_columns`). Un-migrated rows stay `null` → fallback path.
3. ✅ **AST renderer** — `<rte-render [doc]>` walker (recursive structural + declarative marks D5b + unknown-block dev placeholder that never throws).
4. ✅ **Block registry + first blocks** — `provideBlockRenderers(imageRefBlockRenderer, galleryBlockRenderer)` wired in landing `app.config.ts`. Block components live in `libs/landing/shared/ui/src/components/blocks/` (sanctioned sub-bucket, not a 4th lib). `image-ref` → `<landing-figure lightbox>`, `gallery` → `<landing-gallery [lightbox]>` → **in-content figures now get the full-screen viewer**. `gallery` is a **dormant seam**: full Zod schema + block + registration, but no adapter path yet (E has no gallery node) — proves "register a block = one entry."
5. ✅ **Cache-fallback split** — `<rte-render-html>` retained for RSS/llms.txt/OG/no-JS; SSR crawler-completeness of the AST path proven via a real `renderApplication` node test (`prose-blocks.ssr.spec.ts`).
6. ✅ **Consumer swap** — `project-detail` + `blog-detail` render `<rte-render [doc]>` when canonical present, else fall back to `<rte-render-html>`. Renderer owns heading slugs (`collectHeadings` → `[id]` + `headings()`); consumer ToC reads `viewChild(RteRender).headings()`. Highlights CAO stay on `<rte-render-html>` (separate HTML fields, no canonical).

## Risks & mitigations

| Risk                                             | Mitigation                                                                                                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NgComponentOutlet` hydration mismatch under SSR | Declarative outlet participates in SSR + incremental hydration natively; add a hydration smoke test per block. Prefer this over manual `createComponent`.                                                 |
| Inline-mark renderer balloons                    | Marks are a fixed small whitelist (bold/italic/link/code/u/s). Recursive template, no open-ended HTML.                                                                                                    |
| E schema drift breaks ingest                     | Coupling isolated to the D3 adapter + our `schemaVersion`. E changes never reach the renderer.                                                                                                            |
| Media resolution (`ctx.media`) async vs SSR      | Resolve media metadata before render (batched, per-page, via landing data-access); `RenderContext` exposes a synchronous lookup over the pre-resolved map.                                                |
| Two render paths (AST + HTML-cache) drift        | The AST path is canonical; the cache is regenerated from the same canonical JSON at write-time. Single upstream source.                                                                                   |
| Premature build (only one block type exists)     | This epic is explicitly sequenced AFTER RTE. The RTE `data-block` approach is the sanctioned interim for the single `image-ref` block; do not start this epic until a 2nd block type is genuinely needed. |

## Acceptance criteria

- [x] `rte-core` exports `PortableDocument`/`PortableNode` and ≥2 Zod block attr schemas; `rte-contract` exports `BlockRenderer`, `BLOCK_RENDERERS`, `provideBlockRenderers`, `RenderContext`.
- [x] BE write-time normalizes E JSON → canonical `PortableDocument` (adapter is the only code that knows E's node names).
- [x] `<rte-render [doc]>` renders an AST with **no `[innerHTML]`** on the canonical path (inline marks declarative).
- [x] Registering a new block on landing is exactly one `provideBlockRenderers` entry — demonstrated with a 2nd block (`gallery`) beyond `image-ref`.
- [x] Unknown node type renders the fallback, never throws.
- [x] Security: a doc with a disallowed node/attr/`javascript:` URL is stripped at write-time; renderer ignores unknown types at read-time. Test asserts both.
- [x] SSR initial paint contains the fully-rendered block HTML (crawler-complete) without loading Tiptap or the editor (proven via `renderApplication` node test).
- [x] `<rte-render-html>` retained for RSS/llms.txt/OG/no-JS fallback (DOMPurify), and is the only `[innerHTML]` binding.
- [x] RTE Phase 6/7 `[innerHTML]` + `data-block` hydration retired from `project-detail` and `blog-detail` **on the canonical path** — the HTML path survives as the graceful fallback for rows without canonical (D7). Full removal of the fallback branch is gated on a data backfill — tracked as a follow-up below.

## Post-epic follow-ups

- **Data backfill to activate the AST path — DONE (2026-07-01).** `useAst()` is `false` until `bodyCanonical`/`contentCanonical` are populated; without it a page renders via the identical HTML fallback. **`pnpm migrate:editor` does NOT fill canonical** — it skips rows already at `LATEST_SCHEMA_VERSION`, and existing content is already at latest with `canonical = null`. The dedicated **`pnpm backfill:canonical`** (`apps/api/scripts/backfill-canonical.ts`) closes the gap: it reads each row's existing `bodyJson`/`contentJson`, runs `RichTextService.toCanonicalFormTranslatable`, and writes back **only** the `*Canonical` column (`--dry-run` / `--force` / `--module=`). Idempotent; reverting a row is `SET "…Canonical" = NULL` → falls back to HTML. First run: 3 blog rows filled, 0 errors. **What backfill can/can’t reach:** it only helps rows that carry an editor `*Json` source. Portfolio content seeded before the editor (all 8 projects’ `bodyJson`, ~13 markdown-seeded posts’ `contentJson`) is `null` → not backfillable, stays on the HTML fallback (correct). Those must be **re-saved through the console** to gain an editor source, then backfilled (or the save fills canonical directly).
- **Known behavioral shift on activation:** the AST path renders only **media-backed** figures (`imageRef` → `<landing-figure>`); a bare URL `<img>` node that the HTML fallback would show is **dropped** by the D3 adapter (D6). Content authored via the media picker is unaffected; any body that embedded a raw-URL image will lose it on the AST path until re-inserted through the picker.
- **Retire the fallback branch** once all content carries canonical: delete the `@else` `<rte-render-html>` branch + `hydrateImageRefs` + `addHeadingAnchors` read-time slugger from `project.detail`/`blog.detail`. Coordinate with task 363 (drop legacy prose columns) and task 323 (llms.txt still consumes the HTML cache).
- **home-intro (task 312)** — still blocked on per-paragraph lamp/pen; the AST renderer is the sanctioned path when it unblocks.

## References

- [`epic-portfolio-rich-text-editor`](./epic-portfolio-rich-text-editor.md) — parent pipeline (JSON canonical, write-time HTML, DI swap-ability). This epic supersedes its Phase 6/7 read-path.
- RTE task 308 (`rte-renderer`) and 316 (`image-ref` hydrate) — superseded/folded into Phases 3–4 here.
- Task 323 (`landing-llms-txt`) — consumer of the HTML-cache fallback (D7).
- Gutenberg block registration & Interactivity API (reference model for D4/D5).
- Sanity Portable Text / ProseMirror node-tree rendering (reference for AST-renderer registry).
