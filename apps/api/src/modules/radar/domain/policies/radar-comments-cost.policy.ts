import { RadarCommentTierInput, RadarFetchTier } from '../radar-comment.types';
import { RadarCommentTierPolicy } from './radar-comment-tier.policy';

/** What a comments job may cost, how a run's cap is shared between its jobs, and how a cap hit shows. */
export class RadarCommentsCostPolicy {
  // --- Constants ---

  /** The comments actor's pay-per-event price (free tier). */
  static readonly COMMENT_PRICE_USD = 0.0025;
  static readonly ACTOR_START_PRICE_USD = 0.001;
  /** Slack over a job's worst case, so the event that would have reached the cap still fits. */
  static readonly CHARGE_CAP_SLACK_USD = 2 * RadarCommentsCostPolicy.COMMENT_PRICE_USD;
  /** Share of the run's cap the bounded tiers may take, leaving the rest for the reply-heavy one. */
  private static readonly BOUNDED_SHARE = 0.8;

  // --- Rules ---

  /** The most a job can cost: bounded without replies, unbounded with them (replies have no limit). */
  static worstCaseUsd(tier: RadarCommentTierInput, posts: number): number {
    if (tier.includeReplies) return Infinity;
    return (
      posts * tier.resultsLimit * RadarCommentsCostPolicy.COMMENT_PRICE_USD +
      RadarCommentsCostPolicy.ACTOR_START_PRICE_USD
    );
  }

  /**
   * True when billing reached the cap: Apify ends a capped run as SUCCEEDED, so the item count is
   * the only sign. A cap that covers the job's worst case cannot be reached.
   */
  static reachedChargeCap(itemCount: number, maxChargeUsd: number, worstCase = Infinity): boolean {
    const billed =
      itemCount * RadarCommentsCostPolicy.COMMENT_PRICE_USD + RadarCommentsCostPolicy.ACTOR_START_PRICE_USD;
    return maxChargeUsd < worstCase && billed >= maxChargeUsd - RadarCommentsCostPolicy.CHARGE_CAP_SLACK_USD;
  }

  /**
   * Splits a run's cap across its tier jobs. Bounded tiers (no replies) get their worst case plus
   * the slack, so a full answer never reads as a cap hit; the reply-heavy `full` tier gets what is
   * left. If the bounded tiers alone would pass {@link BOUNDED_SHARE} of the cap, they are scaled down.
   */
  static splitCap(
    byTier: ReadonlyMap<RadarFetchTier, readonly unknown[]>,
    totalUsd: number
  ): Map<RadarFetchTier, number> {
    const bound = (tier: RadarFetchTier) =>
      RadarCommentsCostPolicy.worstCaseUsd(RadarCommentTierPolicy.input(tier), byTier.get(tier)?.length ?? 0) +
      RadarCommentsCostPolicy.CHARGE_CAP_SLACK_USD;
    const bounded = (['light', 'full-flat'] as const).filter((t) => byTier.has(t));
    const boundedSum = bounded.reduce((sum, t) => sum + bound(t), 0);
    const scale =
      boundedSum > totalUsd * RadarCommentsCostPolicy.BOUNDED_SHARE
        ? (totalUsd * RadarCommentsCostPolicy.BOUNDED_SHARE) / boundedSum
        : 1;

    const caps = new Map<RadarFetchTier, number>(
      bounded.map((t) => [t, RadarCommentsCostPolicy.roundDown(bound(t) * scale)])
    );
    if (byTier.has('full')) caps.set('full', RadarCommentsCostPolicy.roundDown(totalUsd - boundedSum * scale));
    return caps;
  }

  // --- Private ---

  /** To $0.001, down, so the split never adds up past the run's cap. */
  private static roundDown(usd: number): number {
    return Math.floor(usd * 1000) / 1000;
  }
}
