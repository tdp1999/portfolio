import { RADAR_RUN_CANCELLED_MESSAGE } from '@portfolio/shared/types';
import { DEFAULT_RUN_WINDOW_MONTHS } from './radar.constants';
import { RUN_STATUS_LABELS, RUN_STEP_LABELS } from './radar.data';
import type { RadarRun, RadarRunDisplayStatus, RadarRunStatus, RadarStepRun, RunNotice } from './radar.types';

const ACTIVE_STATUSES: readonly RadarRunStatus[] = ['PENDING', 'RUNNING', 'AWAITING_EXTERNAL'];

/** Still moving through the pipeline: the tick advances it, or it waits on an upload or `/radar work`. */
export const isRunActive = (run: RadarRun): boolean => ACTIVE_STATUSES.includes(run.status);

/** A Manual run parks on CAPTURE until its export is uploaded with the run's id. */
export const awaitsUpload = (run: RadarRun): boolean =>
  run.flow === 'MANUAL' && run.steps[0]?.status === 'AWAITING_EXTERNAL';

/**
 * Where the next run of a source should start, as a picker date: the day after its last successful
 * run's window end (or the day it ran, if it had none), so runs chain without a gap and the two
 * windows never share a day. Never later than today. A source with no successful run starts
 * `DEFAULT_RUN_WINDOW_MONTHS` back. `runs` is the newest-first list `GET /radar/runs` returns.
 */
export function defaultWindowFrom(runs: RadarRun[], sourceId: string, now: Date): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last = runs.find((r) => r.source.id === sourceId && r.status === 'DONE');
  if (!last) {
    return new Date(today.getFullYear(), today.getMonth() - DEFAULT_RUN_WINDOW_MONTHS, today.getDate());
  }
  // The window end is the last millisecond of a UTC day, so 1 ms later is the next day.
  const next = last.windowTo ? new Date(new Date(last.windowTo).getTime() + 1) : new Date(last.createdAt);
  const day = new Date(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate());
  return day > today ? today : day;
}

/** The one line the Runs page shows under a run that needs the Owner: why it failed, or what to do next. */
export function runNotice(run: RadarRun): RunNotice | null {
  if (run.status === 'FAILED') {
    const step = run.steps.find((s) => s.status === 'FAILED');
    if (isCancelled(run)) {
      return { kind: 'cancelled', title: step ? `Cancelled at ${RUN_STEP_LABELS[step.step]}` : 'Cancelled' };
    }
    return {
      kind: 'failed',
      title: step ? `${RUN_STEP_LABELS[step.step]} failed` : 'Run failed',
      message: step?.error ?? run.error ?? 'No error message was recorded.',
    };
  }
  if (awaitsUpload(run)) return { kind: 'awaiting-upload' };
  const analyze = run.steps.find((s) => s.step === 'ANALYZE');
  if (analyze?.status === 'AWAITING_EXTERNAL') return { kind: 'awaiting-work' };
  return null;
}

/**
 * Window bounds are whole UTC days, the same days the provider filters on (`YYYY-MM-DD`). The
 * picker hands back local midnight, so the calendar day is read in local time, then pinned to UTC.
 */
export const utcDayStart = (day: Date): Date => new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));

/** "To 5 Oct" means through the end of that day. */
export const utcDayEnd = (day: Date): Date =>
  new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999));

/** Hover text of one step: its status, the adapter that ran it, and its error if it failed. */
export function stepTooltip(step: RadarStepRun): string {
  const base = `${RUN_STEP_LABELS[step.step]}: ${RUN_STATUS_LABELS[step.status]} (${step.adapter})`;
  return step.error ? `${base}. ${step.error}` : base;
}

/**
 * One line under the step icons: the step the run is on (or stopped at) and its status.
 * A Phase A upload without a `runId` was saved as a run with no steps.
 */
export function stepSummary(run: RadarRun): string {
  if (!run.steps.length) return 'Direct upload, no steps';
  const current = run.steps.find((s) => s.status !== 'DONE');
  if (!current) return 'All steps done';
  if (isCancelled(run)) return `Cancelled at ${RUN_STEP_LABELS[current.step]}`;
  return `${RUN_STEP_LABELS[current.step]}: ${RUN_STATUS_LABELS[current.status].toLowerCase()}`;
}

/** "3 new, 7 updated", plus the failed count only when there is one. */
export function itemsDetail(run: RadarRun): string {
  const parts = [`${run.itemsCreated} new`, `${run.itemsUpdated} updated`];
  if (run.itemsFailed) parts.push(`${run.itemsFailed} failed`);
  return parts.join(', ');
}

/** Cancel ends a run as FAILED with a fixed message; the page tells the two apart by that message. */
export const isCancelled = (run: RadarRun): boolean =>
  run.status === 'FAILED' && run.error === RADAR_RUN_CANCELLED_MESSAGE;

export const displayStatus = (run: RadarRun): RadarRunDisplayStatus => (isCancelled(run) ? 'CANCELLED' : run.status);
