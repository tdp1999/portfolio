import type { Locale } from '@portfolio/shared/types';
import type { PortableNode } from '@portfolio/shared/features/rte-core';

/**
 * Node types the TipTap engine names differently from the portable vocabulary.
 *
 * There is exactly one so far: the engine swaps TipTap's ordered list for its own
 * `customOrderedList`, which carries a legal-numbering attribute plain `<ol>`
 * cannot express.
 */
const ENGINE_NODE_ALIASES: Readonly<Record<string, string>> = {
  customOrderedList: 'orderedList',
};

/**
 * Translate an engine document into the portable vocabulary the read path speaks.
 *
 * This function is the boundary the architecture band claims exists, doing actual
 * work. `rte-render` is engine-free on purpose — it must never learn a TipTap
 * extension's node name, or the "swap the engine, change one provider" claim
 * quietly stops being true. So the renaming happens here, on the way out of the
 * engine, and the renderer keeps seeing only vocabulary it owns.
 *
 * Unknown types are passed through untouched rather than dropped: the renderer
 * already has a visible fallback for a block it does not know, and silently
 * losing content would be the worse failure.
 */
export function toPortable(nodes: readonly PortableNode[]): PortableNode[] {
  return nodes.map((node) => {
    const type = ENGINE_NODE_ALIASES[node.type] ?? node.type;
    const content = Array.isArray(node.content) ? toPortable(node.content as PortableNode[]) : node.content;
    return { ...node, type, ...(content ? { content } : {}) } as PortableNode;
  });
}

/** GET + parse, swallowing every failure into `null`. */
export async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Past which point a commit date stops being evidence and starts being an
 * argument against the page. Six months of silence next to a "Live" badge reads
 * as abandoned, and a reader is right to read it that way — so the column simply
 * does not render rather than volunteering it.
 */
const STALE_AFTER_DAYS = 180;

/**
 * "3 days ago" from an ISO timestamp. Null in, null out — a missing value must
 * stay missing rather than becoming a misleading "just now". Also null once the
 * date is older than {@link STALE_AFTER_DAYS}.
 *
 * `locale` defaults to `en`, so existing callers (and the unit tests) keep the
 * English phrasing; the product page passes the live `locale()` so the fact row
 * reads in one language.
 */
export function relativeTime(iso: string | null, locale: Locale = 'en'): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days > STALE_AFTER_DAYS) return null;

  if (locale === 'vi') {
    if (days <= 0) return 'hôm nay';
    if (days === 1) return 'hôm qua';
    if (days < 30) return `${days} ngày trước`;
    const months = Math.round(days / 30);
    return months === 1 ? 'một tháng trước' : `${months} tháng trước`;
  }

  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? 'a month ago' : `${months} months ago`;
}
