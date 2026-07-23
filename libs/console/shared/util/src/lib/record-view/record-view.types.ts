/** Bilingual value as stored by every translatable column. Both sides optional:
 * an author may have written one language and not the other, and the read view
 * must be able to say so. */
export interface Translatable {
  en?: string;
  vi?: string;
}

export type RecordLocale = 'en' | 'vi';

/**
 * What is actually behind a field, in the language currently being read.
 *
 * Three states, never two. A two-state model forces a silent fallback to the
 * other language, which hides exactly the gap the author needs to see. See
 * ADR-026.
 */
export type RecordFieldState = 'filled' | 'other-locale' | 'unset';

/**
 * A module's declaration of ONE long-form field. This is the only part of a
 * record view that is genuinely domain knowledge — `hasContent`, gap counts,
 * fold ids and translation progress are all derived from a list of these.
 */
export interface RecordFieldDescriptor<T> {
  id: string;
  label: string;
  read: (record: T) => Translatable | null | undefined;
}

/** A descriptor resolved against a record in a given locale. */
export interface ResolvedRecordField {
  id: string;
  label: string;
  text: string;
  state: RecordFieldState;
}

export interface TranslationProgress {
  /** Fields written in the locale being read. */
  written: number;
  /** Fields that exist in at least one language. */
  total: number;
}
