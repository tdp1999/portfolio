import { isPlainObject } from '@portfolio/shared/utils/lite';

/** Max field errors listed under a rejected upload; the rest are summarised as a count. */
const MAX_LINES = 20;

/**
 * Turns the `data` of a rejected upload (`{ "<path>": ["message", ...] }`, e.g. `{ "3.url": [...] }`)
 * into readable lines. Anything else yields no lines and the caller shows the API message alone.
 */
export function toUploadErrorLines(data: unknown): string[] {
  if (!isPlainObject(data)) return [];
  const lines = Object.entries(data).flatMap(([path, messages]) =>
    (Array.isArray(messages) ? messages : [messages]).map((m) => (path ? `${path}: ${String(m)}` : String(m)))
  );
  if (lines.length <= MAX_LINES) return lines;
  return [...lines.slice(0, MAX_LINES), `and ${lines.length - MAX_LINES} more`];
}
