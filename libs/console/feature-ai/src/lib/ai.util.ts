import { AI_LIMIT_SOURCE_LABELS, AI_LIMIT_WINDOW_LABELS } from './ai.data';
import type { AiLimitRow, AiLimits, AiLimitsView, AiModelRow } from './ai.types';

const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

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

const GROUPED = new Intl.NumberFormat('en');

/** A limit figure: grouped below 10,000, short above, "Unknown" when the provider gave none. */
export function formatCount(value: number | null, missing = 'Unknown'): string {
  if (value === null) return missing;
  return value < 10_000 ? GROUPED.format(value) : COMPACT.format(value);
}

/** "2026-10-07 10:00 UTC": readable without depending on the viewer's locale. */
function utcStamp(iso: string): string {
  return `${iso.slice(0, 16).replace('T', ' ')} UTC`;
}

/** The Limits section's figures, formatted once per response so the template only reads fields. */
export function toLimitsView(data: AiLimits): AiLimitsView {
  const { dailyCap, usage } = data;
  return {
    capSpentMicroUsd: dailyCap.spentMicroUsd,
    capMicroUsd: dailyCap.capMicroUsd,
    capPercent:
      dailyCap.capMicroUsd > 0 ? Math.min(100, Math.round((dailyCap.spentMicroUsd / dailyCap.capMicroUsd) * 100)) : 0,
    capResetsAt: dailyCap.resetsAt,
    callsLastMinute: formatCount(usage.callsLastMinute),
    callsToday: formatCount(usage.callsToday),
    tokensToday: formatTokens(usage.tokensToday),
    searchQueriesThisMonth: formatCount(usage.searchQueriesThisMonth),
    rows: data.limits.map(
      (l): AiLimitRow => ({
        key: `${l.metric}|${l.model ?? ''}`,
        label: l.label,
        scope: [l.model ?? 'All models', l.window ? AI_LIMIT_WINDOW_LABELS[l.window] : null].filter(Boolean).join(', '),
        limit: formatCount(l.limit),
        used: formatCount(l.used, 'Not counted'),
        remaining: formatCount(l.remaining),
        resetAt: l.resetAt,
        sourceLabel: AI_LIMIT_SOURCE_LABELS[l.source],
        sourceHint: l.checkedOn
          ? `Checked on ${l.checkedOn}`
          : l.observedAt
            ? `Last reported ${utcStamp(l.observedAt)}`
            : '',
        url: l.url,
      })
    ),
    models: data.models.map(
      (m): AiModelRow => ({
        model: m.model,
        input: formatCount(m.inputTokenLimit),
        output: formatCount(m.outputTokenLimit),
        thinking: m.thinking === null ? 'Unknown' : m.thinking ? 'Yes' : 'No',
        error: m.error,
      })
    ),
    balance: data.balance
      ? new Intl.NumberFormat('en', { style: 'currency', currency: data.balance.currency }).format(data.balance.amount)
      : null,
  };
}
