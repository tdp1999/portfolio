import type {
  RecordFieldDescriptor,
  RecordFieldState,
  RecordLocale,
  ResolvedRecordField,
  Translatable,
  TranslationProgress,
} from './record-view.types';

/**
 * Read a bilingual value for the locale being read, WITHOUT falling back to the
 * other language.
 *
 * Deliberately different from the shared `translatable` pipe, which resolves
 * `locale → en → vi → '—'`. That fallback is right for the public site — a
 * visitor should see content rather than a hole — and wrong for the console,
 * where the author needs to know a translation is missing. Do not merge the
 * two; they serve opposite goals. See ADR-026.
 */
export function resolveTranslatable(
  value: Translatable | null | undefined,
  locale: RecordLocale
): { text: string; state: RecordFieldState } {
  const active = (locale === 'en' ? value?.en : value?.vi)?.trim() ?? '';
  if (active) return { text: active, state: 'filled' };

  const other = (locale === 'en' ? value?.vi : value?.en)?.trim() ?? '';
  return { text: '', state: other ? 'other-locale' : 'unset' };
}

/** Resolve a module's field declarations against one record. */
export function describeFields<T>(
  record: T | null | undefined,
  descriptors: readonly RecordFieldDescriptor<T>[],
  locale: RecordLocale
): ResolvedRecordField[] {
  if (!record) return [];
  return descriptors.map((d) => {
    const { text, state } = resolveTranslatable(d.read(record), locale);
    return { id: d.id, label: d.label, text, state };
  });
}

/**
 * Fields that are present-but-not-readable in this locale, plus fields that are
 * absent entirely — i.e. what the section header reports as still to do.
 */
export function countGaps(fields: readonly ResolvedRecordField[]): number {
  return fields.filter((f) => f.state !== 'filled').length;
}

/** True when at least one field exists in SOME language: the test for whether
 * a section is rendered at all. A section where everything is `unset` is
 * withheld and its name goes to `console-record-empty-sections` instead. */
export function hasAnyContent(fields: readonly ResolvedRecordField[]): boolean {
  return fields.some((f) => f.state !== 'unset');
}

/** Fold ids for a section — only fields that have something to open. */
export function foldableIds(fields: readonly ResolvedRecordField[]): string[] {
  return fields.filter((f) => f.state !== 'unset').map((f) => f.id);
}

/** Feeds the "N of M fields written in <language>" note in the rail. */
export function translationProgress<T>(
  record: T | null | undefined,
  descriptors: readonly RecordFieldDescriptor<T>[],
  locale: RecordLocale
): TranslationProgress {
  const fields = describeFields(record, descriptors, locale);
  return {
    written: fields.filter((f) => f.state === 'filled').length,
    total: fields.filter((f) => f.state !== 'unset').length,
  };
}

/**
 * Members of a collection that are missing at least one required part — the
 * gap signal for a section of items (a highlight with no Outcome written).
 *
 * ```ts
 * countIncomplete(project.highlights, [(h) => h.challengeHtml, (h) => h.outcomeHtml]);
 * ```
 */
export function countIncomplete<T>(
  items: readonly T[] | null | undefined,
  parts: readonly ((item: T) => unknown)[]
): number {
  if (!items?.length) return 0;
  return items.filter((item) => parts.some((read) => isBlank(read(item)))).length;
}

/**
 * Names of the sections that are absent in full, for
 * `console-record-empty-sections`.
 *
 * Pass SECTION-level absences only. A field that is empty inside a section that
 * is on screen already renders its own "Not set" line, and reporting the same
 * absence twice is worse than not reporting it.
 */
export function collectEmptySections(entries: readonly { name: string; empty: boolean }[]): string[] {
  return entries.filter((e) => e.empty).map((e) => e.name);
}

/** One-line summary for a collapsed fold. A fold without a gist is a tab. */
export function gist(text: string, maxLength = 96): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

function isBlank(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    const t = value as Translatable;
    if ('en' in t || 'vi' in t) return !t.en?.trim() && !t.vi?.trim();
  }
  return false;
}
