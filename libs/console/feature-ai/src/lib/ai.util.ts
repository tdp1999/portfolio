const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** Micro-USD as dollars, precise enough to tell tiny costs apart: 18 → "$0.000018", 1_234_567 → "$1.23". */
export function formatCost(microUsd: number | null): string {
  if (microUsd === null) return 'No price';
  if (microUsd === 0) return '$0';
  const usd = microUsd / 1_000_000;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${Number(usd.toPrecision(2))}`;
}

/** Token counts in short form: 950 → "950", 12_400 → "12.4K". */
export function formatTokens(tokens: number): string {
  return COMPACT.format(tokens);
}

export function formatLatency(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

/** What the built-in tools did during a call, or null when it used none. */
export function toolSummary(searchCount: number, urlCount: number): string | null {
  const parts = [
    searchCount ? `${searchCount} ${searchCount === 1 ? 'search' : 'searches'}` : '',
    urlCount ? `${urlCount} ${urlCount === 1 ? 'page' : 'pages'} read` : '',
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}
