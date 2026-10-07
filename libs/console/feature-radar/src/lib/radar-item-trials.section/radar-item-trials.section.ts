import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Money, RecordFold, ToastService } from '@portfolio/console/shared/ui';
import { catchError, EMPTY, finalize, Subscription, timer } from 'rxjs';
import { MarkdownPipe } from '../markdown.pipe';
import { TRIAL_MODEL_SUGGESTIONS, TRIAL_POLL_MS } from '../radar.constants';
import { RadarService } from '../radar.service';
import { RadarAnalysisDepth, RadarItemDetail, RadarTrial, RadarTrialColumn } from '../radar.types';

/**
 * Quality trials (task 419): runs the server AI on this post again and shows each answer beside the
 * current enrichment, field by field, so the Owner can judge a model before making it the default.
 * A trial never replaces the enrichment.
 */
@Component({
  selector: 'console-radar-item-trials-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MarkdownPipe,
    Money,
    RecordFold,
  ],
  templateUrl: './radar-item-trials.section.html',
  styleUrl: './radar-item-trials.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarItemTrialsSection {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  // ── Inputs / outputs ──────────────────────────────────────────────
  readonly item = input.required<RadarItemDetail>();

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly trials = signal<RadarTrial[]>([]);
  protected readonly starting = signal(false);

  // ── Form ──────────────────────────────────────────────────────────
  protected readonly form = this.fb.group({
    depth: this.fb.control<RadarAnalysisDepth>('deep'),
    model: this.fb.control(''),
  });
  protected readonly modelSuggestions = TRIAL_MODEL_SUGGESTIONS;

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly running = computed(() => this.trials().some((t) => t.status === 'RUNNING'));
  protected readonly busy = computed(() => this.starting() || this.running());
  /** The folded row's one-liner: how many trials this post has, and whether one is running. */
  protected readonly gist = computed(() => {
    if (this.running()) return 'A trial is running';
    const n = this.trials().length;
    return n ? `${n} trial${n === 1 ? '' : 's'} to compare` : 'Compare the analysis with another model';
  });
  protected readonly columns = computed<RadarTrialColumn[]>(() => {
    const e = this.item().enrichment;
    const current: RadarTrialColumn[] = e
      ? [
          {
            key: 'current',
            heading: 'Current',
            model: `${e.producerAdapter} · ${e.producerModel}`,
            status: 'DONE',
            error: null,
            tldr: e.tldr,
            score: e.signalScore,
            overview: e.overview,
            context: e.context,
            applyNote: e.applyNote,
            factCheck: e.factCheck,
            sources: e.sources,
            usage: null,
          },
        ]
      : [];
    return [...current, ...this.trials().map(RadarItemTrialsSection.toColumn)];
  });

  // ── Plain state ───────────────────────────────────────────────────
  private loadSub?: Subscription;

  constructor() {
    // Prev/next reuse the page with another item: reload, and drop the old item's poll.
    effect(() => this.load(this.item().id));
    inject(DestroyRef).onDestroy(() => this.loadSub?.unsubscribe());
  }

  onRun(): void {
    const { depth, model } = this.form.getRawValue();
    this.starting.set(true);
    this.radarService
      .createTrials({ itemIds: [this.item().id], depth, model: model.trim() || undefined })
      .pipe(finalize(() => this.starting.set(false)))
      .subscribe((result) => {
        if (result.skipped.length) this.toast.error(result.skipped[0].reason);
        else this.toast.success('Trial started; it takes up to a minute');
        this.load(this.item().id);
      });
  }

  // ── shared helpers ────────────────────────────────────────────────
  /** Loads the trials, then polls while one is still running. */
  private load(itemId: string, delayMs = 0): void {
    this.loadSub?.unsubscribe();
    this.loadSub = timer(delayMs).subscribe(() => {
      this.loadSub = this.radarService
        .listTrials(itemId)
        .pipe(catchError(() => EMPTY))
        .subscribe((trials) => {
          this.trials.set(trials);
          if (trials.some((t) => t.status === 'RUNNING')) this.load(itemId, TRIAL_POLL_MS);
        });
    });
  }

  private static toColumn(t: RadarTrial): RadarTrialColumn {
    const e = t.enrichment;
    return {
      key: t.id,
      heading: `Trial · ${t.depth}`,
      model: e ? `${e.producer.adapter} · ${e.producer.model}` : (t.requestedModel ?? 'default chain'),
      status: t.status,
      error: t.error,
      tldr: e?.tldr ?? null,
      score: e?.signalScore ?? null,
      overview: e?.overview ?? null,
      context: e?.context ?? null,
      applyNote: e?.applyNote ?? null,
      factCheck: e?.factCheck ?? null,
      sources: e?.sources ?? [],
      usage:
        t.status === 'DONE'
          ? {
              tokensIn: t.tokensIn,
              tokensOut: t.tokensOut,
              costMicroUsd: t.costMicroUsd,
              seconds: t.latencyMs === null ? null : (t.latencyMs / 1000).toFixed(1),
              searches: t.searchQueries,
            }
          : null,
    };
  }
}
