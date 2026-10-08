import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

import type { AiLastCall, AiLedgerWindows, IAiUsageRepository } from '../application/ports/ai-usage.repository.port';
import type { AiLedgerCounts } from '../domain/ai-limit.types';
import type {
  AiCallRecord,
  AiRef,
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

interface CountsRow {
  calls_minute: number;
  calls_day: number;
  input_minute: number;
  input_day: number;
  tokens_day: number;
  search_month: number;
  spent_day: number;
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
        groupType: record.group?.type ?? null,
        groupId: record.group?.id ?? null,
        searchQueries: record.searchQueries,
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
        // Rows written before the searchQueries column hold 0 there; their trace still lists the queries.
        searchCount: Math.max(row.searchQueries, trace?.searchQueries?.length ?? 0),
        urlCount: trace?.urls?.length ?? 0,
      };
    });
  }

  async summarizeGroup(group: AiRef): Promise<AiUsageSummary['byFeature']> {
    const rows = await this.prisma.$queryRaw<TotalsRow[]>`
      SELECT NULL AS model, feature, 1 AS by_model, 0 AS by_feature,
        COUNT(*)::int AS calls,
        (COUNT(*) FILTER (WHERE status <> 'SUCCEEDED'))::int AS failed,
        COALESCE(SUM("inputTokens" + "toolTokens"), 0)::float8 AS tokens_in,
        COALESCE(SUM("outputTokens" + "thinkingTokens"), 0)::float8 AS tokens_out,
        COALESCE(SUM("costMicroUsd"), 0)::float8 AS cost,
        COALESCE(SUM("costMicroUsd") FILTER (WHERE billed), 0)::float8 AS billed
      FROM ai_usage_records
      WHERE "groupType" = ${group.type} AND "groupId" = ${group.id}
      GROUP BY feature
      ORDER BY cost DESC, calls DESC`;
    return rows.map((row) => ({ feature: row.feature ?? '', ...AiUsageRepository.toTotals(row) }));
  }

  async sumCost(group: AiRef): Promise<number> {
    const { _sum } = await this.prisma.aiUsageRecord.aggregate({
      where: { groupType: group.type, groupId: group.id },
      _sum: { costMicroUsd: true },
    });
    return _sum.costMicroUsd ?? 0;
  }

  async sumCostByGroup(type: string, ids: readonly string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const rows = await this.prisma.aiUsageRecord.groupBy({
      by: ['groupId'],
      where: { groupType: type, groupId: { in: [...ids] } },
      _sum: { costMicroUsd: true },
    });
    return new Map(rows.flatMap((r) => (r.groupId ? [[r.groupId, r._sum.costMicroUsd ?? 0] as const] : [])));
  }

  async sumCostSince(from: Date): Promise<number> {
    const { _sum } = await this.prisma.aiUsageRecord.aggregate({
      where: { createdAt: { gte: from } },
      _sum: { costMicroUsd: true },
    });
    return _sum.costMicroUsd ?? 0;
  }

  async countLedger({ minuteFrom, dayFrom, monthFrom }: AiLedgerWindows): Promise<AiLedgerCounts> {
    const from = minuteFrom < monthFrom ? minuteFrom : monthFrom;
    const [row] = await this.prisma.$queryRaw<CountsRow[]>`
      SELECT
        (COUNT(*) FILTER (WHERE "createdAt" >= ${minuteFrom}))::int AS calls_minute,
        (COUNT(*) FILTER (WHERE "createdAt" >= ${dayFrom}))::int AS calls_day,
        COALESCE(SUM("inputTokens" + "toolTokens") FILTER (WHERE "createdAt" >= ${minuteFrom}), 0)::float8 AS input_minute,
        COALESCE(SUM("inputTokens" + "toolTokens") FILTER (WHERE "createdAt" >= ${dayFrom}), 0)::float8 AS input_day,
        COALESCE(SUM("inputTokens" + "toolTokens" + "outputTokens" + "thinkingTokens") FILTER (WHERE "createdAt" >= ${dayFrom}), 0)::float8 AS tokens_day,
        COALESCE(SUM("searchQueries") FILTER (WHERE "createdAt" >= ${monthFrom}), 0)::float8 AS search_month,
        COALESCE(SUM("costMicroUsd") FILTER (WHERE "createdAt" >= ${dayFrom}), 0)::float8 AS spent_day
      FROM ai_usage_records
      WHERE "createdAt" >= ${from}`;
    return {
      callsLastMinute: row?.calls_minute ?? 0,
      callsToday: row?.calls_day ?? 0,
      inputTokensLastMinute: Number(row?.input_minute ?? 0),
      inputTokensToday: Number(row?.input_day ?? 0),
      tokensToday: Number(row?.tokens_day ?? 0),
      searchQueriesThisMonth: Number(row?.search_month ?? 0),
      spentTodayMicroUsd: Math.round(Number(row?.spent_day ?? 0)),
    };
  }

  async listModelsSince(from: Date, limit: number): Promise<string[]> {
    const rows = await this.prisma.aiUsageRecord.groupBy({
      by: ['model'],
      where: { createdAt: { gte: from } },
      _count: { _all: true },
      orderBy: { _count: { model: 'desc' } },
      take: limit,
    });
    return rows.map((r) => r.model);
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
