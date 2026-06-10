/**
 * Semantic kind of a link — auto-detected from `href` unless explicitly set.
 *
 * - `internal` — same-app route (`/foo`). Right arrow when `arrow=true`.
 * - `external` — `http(s)://` URL. Up-right arrow + `target=_blank`.
 * - `mail` — `mailto:` URL. Envelope icon prepended.
 * - `tel` — `tel:` URL. Phone icon prepended.
 * - `download` — file URL. Download icon prepended + native `download` attr.
 *   Must be set explicitly (no href prefix to detect).
 * - `anchor` — same-page hash (`#section`). No auto icon.
 */
export type LandingLinkKind = 'internal' | 'external' | 'mail' | 'tel' | 'download' | 'anchor';
