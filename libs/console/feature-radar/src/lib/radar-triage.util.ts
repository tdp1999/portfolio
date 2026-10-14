import type { RadarTriageStatus } from './radar.types';

export interface TriageBounds {
  atFirst: boolean;
  atLast: boolean;
}

/** One J/K step: another post on this page, the adjacent page (the host loads it), or nothing at an end. */
export type TriageStep = { kind: 'select'; id: string } | { kind: 'page'; delta: 1 | -1 } | null;

/**
 * The walk stops at the Feed's ends, not the page's. `position` is 1-based across pages; a post that is not in the
 * list counts as the end, so the walk never starts from nowhere.
 */
export function triageBounds(position: number | null, total: number): TriageBounds {
  return { atFirst: position === 1, atLast: position === null || position >= total };
}

export function walkStep(
  ids: readonly string[],
  selectedId: string | null,
  delta: 1 | -1,
  bounds: TriageBounds
): TriageStep {
  if (delta < 0 ? bounds.atFirst : bounds.atLast) return null;
  const next = ids[ids.indexOf(selectedId ?? '') + delta];
  return next ? { kind: 'select', id: next } : { kind: 'page', delta };
}

/** The page a walk past the edge opens, or null before the first page or past the last row. */
export function adjacentPage(pageIndex: number, pageSize: number, total: number, delta: 1 | -1): number | null {
  const next = pageIndex + delta;
  return next < 0 || next * pageSize >= total ? null : next;
}

/**
 * Every row of a tab arrived with the tab's status, so pressing the same key again sends the post back to the tab it
 * was decided in (a saved post marked done returns to To try). On its own tab's key it leaves for the Inbox.
 */
export function triageToggle(
  current: RadarTriageStatus,
  tab: RadarTriageStatus,
  status: RadarTriageStatus
): RadarTriageStatus {
  const back = tab === status ? 'INBOX' : tab;
  return current === status ? back : status;
}
