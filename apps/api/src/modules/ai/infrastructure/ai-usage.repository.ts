import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

import type { AiLastCall, IAiUsageRepository } from '../application/ports/ai-usage.repository.port';
import type {
  AiCallRecord,
  AiTrace,
  AiUsageRecordInput,
  AiUsageSummary,
  AiUsageTotals,
} from '../domain/ai-usage.types';
import { PrismaService } from '../../../shared/prisma';

/** One row of the grouping-sets query: model and feature are null on the rows they are not grouped by. */
interface TotalsRow {
  model: string | null;
  feature: string | null;
  by_model: number;
  by_feature: number;
  calls: number;
  failed: number;
  tokens_in: number;
  tokens_out: number;
  cost: number;
  billed: number;
}

/** The Prisma adapter for the usage ledger. Rows are only added, never changed. */
@Injectable()
export class AiUsageRepository implements IAiUsageRepository {
  // --- Constants ---

  private static readonly EMPTY_TOTALS: AiUsageTotals = {
    calls: 0,
    failed: 0,
    tokensIn: 0,
    tokensOut: 0,
    costMicroUsd: 0,
    billedMicroUsd: 0,
  };

  constructor(private readonly prisma: PrismaService) {}

  async add(record: AiUsageRecordInput): Promise<void> {
    await this.prisma.aiUsageRecord.create({
      data: {
        id: uuidv7(),
        provider: record.provider,
        model: record.model,
        feature: record.feature,
        status: record.status,
        errorKind: record.errorKind,
        error: record.error,
        ...record.usage,
        costMicroUsd: record.costMicroUsd,
        billed: record.billed,
        latencyMs: record.latencyMs,
        refType: record.ref?.type ?? null,
        refId: record.ref?.id ?? null,
        trace: record.trace ? (record.trace as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  async findLatest(): Promise<AiLastCall | null> {
    return this.prisma.aiUsageRecord.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, status: true, error: true },
    });
  }

  async summarize(from: Date): Promise<AiUsageSummary> {
    // One pass: overall, per model and per feature. Sums are float8 so a large total never overflows int.
    const rows = await this.prisma.$queryRaw<TotalsRow[]>`
      SELECT model, feature,
        GROUPING(model)::int AS by_model, GROUPING(feature)::int AS by_feature,
        COUNT(*)::int AS calls,
        (COUNT(*) FILTER (WHERE status <> 'SUCCEEDED'))::int AS failed,
        COALESCE(SUM("inputTokens" + "toolTokens"), 0)::float8 AS tokens_in,
        COALESCE(SUM("outputTokens" + "thinkingTokens"), 0)::float8 AS tokens_out,
        COALESCE(SUM("costMicroUsd"), 0)::float8 AS cost,
        COALESCE(SUM("costMicroUsd") FILTER (WHERE billed), 0)::float8 AS billed
      FROM ai_usage_records
      WHERE "createdAt" >= ${from}
      GROUP BY GROUPING SETS ((), (model), (feature))`;

    const summary: AiUsageSummary = { totals: AiUsageRepository.EMPTY_TOTALS, byModel: [], byFeature: [] };
    for (const row of rows) {
      const totals = AiUsageRepository.toTotals(row);
      if (row.by_model && row.by_feature) summary.totals = totals;
      else if (row.model !== null && row.by_feature) summary.byModel.push({ model: row.model, ...totals });
      else if (row.feature !== null && row.by_model) summary.byFeature.push({ feature: row.feature, ...totals });
    }
    const byCost = (a: AiUsageTotals, b: AiUsageTotals) => b.costMicroUsd - a.costMicroUsd || b.calls - a.calls;
    summary.byModel.sort(byCost);
    summary.byFeature.sort(byCost);
    return summary;
  }

  async listRecent(limit: number): Promise<AiCallRecord[]> {
    const rows = await this.prisma.aiUsageRecord.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    return rows.map((row) => {
      const trace = row.trace as Partial<AiTrace> | null;
      return {
        id: row.id,
        createdAt: row.createdAt,
        provider: row.provider,
        model: row.model,
        feature: row.feature,
        status: row.status,
        errorKind: row.errorKind,
        error: row.error,
        tokensIn: row.inputTokens + row.toolTokens,
        tokensOut: row.outputTokens + row.thinkingTokens,
        costMicroUsd: row.costMicroUsd,
        billed: row.billed,
        latencyMs: row.latencyMs,
        ref: row.refType && row.refId ? { type: row.refType, id: row.refId } : null,
        searchCount: trace?.searchQueries?.length ?? 0,
        urlCount: trace?.urls?.length ?? 0,
      };
    });
  }

  // --- Private ---

  private static toTotals(row: TotalsRow): AiUsageTotals {
    return {
      calls: row.calls,
      failed: row.failed,
      tokensIn: Number(row.tokens_in),
      tokensOut: Number(row.tokens_out),
      costMicroUsd: Math.round(Number(row.cost)),
      billedMicroUsd: Math.round(Number(row.billed)),
    };
  }
}
