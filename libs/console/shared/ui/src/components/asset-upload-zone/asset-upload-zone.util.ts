let nextId = 0;

export function getNextUploadId(): string {
  return `upload-${++nextId}`;
}

const ANY_TYPE = new Set(['', '*', '*/*']);

/**
 * Splits an accept list into trimmed, non-empty patterns.
 *
 * Callers write accept lists in three dialects that all reach this component:
 * - HTML file-input dialect — `image/*`, `application/pdf`, `.png`
 * - the media API's mime-PREFIX dialect — `image/`, which doubles as
 *   `MediaListParams.mimeTypePrefix` and is neither valid in an `accept`
 *   attribute nor a complete mime type
 * - comma-separated combinations of the above
 */
function splitAccept(accept: string): string[] {
  return accept
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Normalises an accept list into something the native file dialog understands.
 *
 * A bare prefix (`image/`) is meaningless to the browser: the file dialog matches
 * nothing, so a PNG the library happily lists could never be uploaded through the
 * picker. Rewriting it to `image/*` restores the intended "any image" filter.
 */
export function toAcceptAttr(accept: string): string {
  const patterns = splitAccept(accept);
  if (!patterns.length || patterns.some((p) => ANY_TYPE.has(p))) return '*/*';
  return patterns.map((p) => (p.endsWith('/') ? `${p}*` : p)).join(',');
}

/**
 * True when `file` satisfies at least one pattern of the accept list.
 *
 * Mirrors {@link toAcceptAttr}'s dialects so drag-and-drop — which the browser
 * never filters — is validated by exactly the same rule as the file dialog.
 */
export function matchesAccept(file: File, accept: string): boolean {
  const patterns = splitAccept(accept);
  if (!patterns.length || patterns.some((p) => ANY_TYPE.has(p))) return true;

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return name.endsWith(pattern);
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
    if (pattern.endsWith('/')) return type.startsWith(pattern);
    return type === pattern;
  });
}
