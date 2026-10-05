import type { TriageItem, TriageRow } from './ddl-radar-triage.types';

function scoreTone(score: number | null): string {
  if (score === null) return 'tr-score--pending';
  if (score >= 7) return 'tr-score--high';
  if (score >= 4) return 'tr-score--mid';
  return 'tr-score--low';
}

/** The seed's apply notes carry `**bold**`; the study shows them as plain text. */
export function toTriageRow(item: TriageItem): TriageRow {
  return { ...item, scoreTone: scoreTone(item.score), applyNoteText: (item.applyNote ?? '').replace(/\*\*/g, '') };
}
