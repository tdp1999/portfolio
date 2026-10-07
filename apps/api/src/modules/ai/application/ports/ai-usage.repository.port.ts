import type { AiLedgerCounts } from '../../domain/ai-limit.types';
import type {
  AiCallRecord,
  AiCallStatus,
  AiRef,
  AiUsageRecordInput,
  AiUsageSummary,
} from '../../domain/ai-usage.types';

export interface AiLastCall {
  createdAt: Date;
  status: AiCallStatus;
  error: string | null;
}

export interface IAiUsageRepository {
  add(record: AiUsageRecordInput): Promise<void>;
  findLatest(): Promise<AiLastCall | null>;
  /** Totals since `from`, summed in the database, overall and per model and feature. */
  summarize(from: Date): Promise<AiUsageSummary>;
  listRecent(limit: number): Promise<AiCallRecord[]>;
  /** Sum of `costMicroUsd` over the group's rows; rows without a price count as 0. */
  sumCost(group: AiRef): Promise<number>;
  /** `sumCost` for many groups of one type in one query; a group with no rows is left out. */
  sumCostByGroup(type: string, ids: readonly string[]): Promise<Map<string, number>>;
  /** Sum of `costMicroUsd` over every row since `from`. */
  sumCostSince(from: Date): Promise<number>;
  /** Calls, tokens, search queries and spend for the windows limits are counted in, in one query. */
  countLedger(windows: AiLedgerWindows): Promise<AiLedgerCounts>;
  /** Models called since `from`, most called first. */
  listModelsSince(from: Date, limit: number): Promise<string[]>;
}

export interface AiLedgerWindows {
  minuteFrom: Date;
  dayFrom: Date;
  monthFrom: Date;
}
