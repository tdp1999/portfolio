import type { AiCallRecord, AiCallStatus, AiUsageRecordInput, AiUsageSummary } from '../../domain/ai-usage.types';

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
}
