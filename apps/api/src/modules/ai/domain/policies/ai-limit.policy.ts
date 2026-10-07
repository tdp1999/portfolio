import type { AiLedgerCounts, AiLimitKind, AiLimitWindow } from '../ai-limit.types';

/** How much of a limit the app used, read from the ledger whatever the provider. */
export class AiLimitPolicy {
  // --- Rules ---

  /** Ledger usage for a limit of this kind and window, or null when the ledger does not count it. */
  static used(kind: AiLimitKind, window: AiLimitWindow | null, counts: AiLedgerCounts): number | null {
    switch (`${kind}/${window}`) {
      case 'requests/minute':
        return counts.callsLastMinute;
      case 'requests/day':
        return counts.callsToday;
      case 'input-tokens/minute':
        return counts.inputTokensLastMinute;
      case 'input-tokens/day':
        return counts.inputTokensToday;
      case 'tokens/day':
        return counts.tokensToday;
      case 'web-search-queries/month':
        return counts.searchQueriesThisMonth;
      default:
        return null;
    }
  }

  /** What the provider reported, else the limit minus the ledger usage, never below 0. */
  static remaining(limit: number | null, used: number | null, reported: number | null): number | null {
    if (reported !== null) return reported;
    if (limit === null || used === null) return null;
    return Math.max(0, limit - used);
  }
}
