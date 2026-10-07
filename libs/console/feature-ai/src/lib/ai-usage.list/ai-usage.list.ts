import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { EnumLabelPipe, Property, RelativeTime, SegmentedControl, SkeletonTable } from '@portfolio/console/shared/ui';
import { catchError, EMPTY, finalize, forkJoin, Subject, switchMap, tap } from 'rxjs';

import {
  AI_FEATURE_LABELS,
  AI_RANGE_LABELS,
  AI_RANGE_OPTIONS,
  AI_REF_ROUTES,
  AI_STATUS_BADGES,
  AI_STATUS_LABELS,
  AI_STUDIO_RATE_LIMIT_URL,
  AI_STUDIO_USAGE_URL,
  GEMINI_PRICING_URL,
} from '../ai.data';
import { AiService } from '../ai.service';
import type {
  AiBreakdownRow,
  AiCall,
  AiCallRow,
  AiStatus,
  AiTestResult,
  AiUsage,
  AiUsageRange,
  AiUsageTotals,
} from '../ai.types';
import { formatCost, formatLatency, formatTokens, toolSummary } from '../ai.util';

@Component({
  selector: 'console-ai-usage-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    EnumLabelPipe,
    Property,
    RelativeTime,
    SegmentedControl,
    SkeletonTable,
  ],
  templateUrl: './ai-usage.list.html',
  styleUrl: './ai-usage.list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AiUsageList implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly aiService = inject(AiService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly status = signal<AiStatus | null>(null);
  protected readonly usage = signal<AiUsage | null>(null);
  protected readonly calls = signal<AiCall[]>([]);
  protected readonly range = signal<AiUsageRange>('7d');
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly testing = signal(false);
  protected readonly testResult = signal<AiTestResult | null>(null);
  protected readonly usageError = signal(false);

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly free = computed(() => this.status()?.billing !== 'paid');

  protected readonly totals = computed(() => {
    const t = this.usage()?.totals;
    if (!t) return null;
    return {
      calls: t.calls,
      failed: t.failed,
      tokensIn: formatTokens(t.tokensIn),
      tokensOut: formatTokens(t.tokensOut),
      cost: formatCost(t.costMicroUsd),
      billed: formatCost(t.billedMicroUsd),
    };
  });

  protected readonly byModel = computed<AiBreakdownRow[]>(() =>
    (this.usage()?.byModel ?? []).map((row) => AiUsageList.toBreakdown(row.model, row.model, row))
  );

  protected readonly byFeature = computed<AiBreakdownRow[]>(() =>
    (this.usage()?.byFeature ?? []).map((row) =>
      AiUsageList.toBreakdown(row.feature, AI_FEATURE_LABELS[row.feature] ?? row.feature, row)
    )
  );

  protected readonly breakdowns = computed(() => [
    { title: 'By model', rows: this.byModel() },
    { title: 'By feature', rows: this.byFeature() },
  ]);

  protected readonly callRows = computed<AiCallRow[]>(() =>
    this.calls().map((call) => ({
      ...call,
      featureLabel: AI_FEATURE_LABELS[call.feature] ?? call.feature,
      tokens: `${formatTokens(call.tokensIn)} in, ${formatTokens(call.tokensOut)} out`,
      cost: formatCost(call.costMicroUsd),
      latency: formatLatency(call.latencyMs),
      tools: toolSummary(call.searchCount, call.urlCount),
      refLink: call.ref ? (AI_REF_ROUTES[call.ref.type]?.(call.ref.id) ?? null) : null,
    }))
  );

  protected readonly rangeLabel = computed(() => AI_RANGE_LABELS[this.range()]);

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly rangeOptions = AI_RANGE_OPTIONS;
  protected readonly statusLabels = AI_STATUS_LABELS;
  protected readonly statusBadges = AI_STATUS_BADGES;
  protected readonly rateLimitUrl = AI_STUDIO_RATE_LIMIT_URL;
  protected readonly usageUrl = AI_STUDIO_USAGE_URL;
  protected readonly pricingUrl = GEMINI_PRICING_URL;
  protected readonly breakdownColumns = ['label', 'calls', 'tokens', 'cost'];
  protected readonly callColumns = ['createdAt', 'feature', 'model', 'status', 'tokens', 'cost', 'latency', 'served'];

  /** Range picks: a newer pick cancels the request of an older one, so figures match the label. */
  private readonly rangeChanges = new Subject<AiUsageRange>();

  constructor() {
    this.rangeChanges
      .pipe(
        tap(() => this.usageError.set(false)),
        switchMap((range) =>
          this.aiService.getUsage(range).pipe(
            catchError(() => {
              this.usageError.set(true);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((usage) => this.usage.set(usage));
  }

  ngOnInit(): void {
    this.load();
  }

  onRetry(): void {
    this.loading.set(true);
    this.load();
  }

  onRangeChange(range: string): void {
    this.range.set(range as AiUsageRange);
    this.rangeChanges.next(this.range());
  }

  /** The test writes a usage row like any call, so the page reloads afterwards to show it. */
  onTest(): void {
    this.testing.set(true);
    this.testResult.set(null);
    this.aiService
      .testConnection()
      .pipe(
        finalize(() => this.testing.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        this.testResult.set(result);
        this.load();
      });
  }

  // ── Private ───────────────────────────────────────────────────────
  private load(): void {
    this.loadError.set(false);
    forkJoin({
      status: this.aiService.getStatus(),
      usage: this.aiService.getUsage(this.range()),
      calls: this.aiService.listCalls(),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ status, usage, calls }) => {
          this.status.set(status);
          this.usage.set(usage);
          this.calls.set(calls);
        },
        error: () => this.loadError.set(true),
      });
  }

  private static toBreakdown(key: string, label: string, totals: AiUsageTotals): AiBreakdownRow {
    return {
      key,
      label,
      calls: totals.calls,
      failed: totals.failed,
      tokens: `${formatTokens(totals.tokensIn)} in, ${formatTokens(totals.tokensOut)} out`,
      cost: formatCost(totals.costMicroUsd),
    };
  }
}
