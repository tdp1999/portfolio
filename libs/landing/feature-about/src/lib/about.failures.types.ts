/**
 * Failures & lessons section — display shape consumed by the lib component
 * AND the DDL V2/V3 variants. Source content is now console-managed
 * (`AboutFailure` aggregate, see `apps/api/src/modules/about-failure/**`),
 * fetched via `FailureService` and localized in the component layer (EN
 * fallback per-item).
 *
 * This file used to ship inline `getFailureEssays()` placeholder content;
 * that helper was retired in task 345 alongside the console CRUD flow. The
 * file now exists ONLY to keep `FailureEssay` re-exportable from the lib
 * barrel so DDL V2/V3 imports stay green.
 */
export type FailureEssay = {
  /** Stable identifier — the BE row id (uuid). */
  readonly id: string;
  /** Year tag rendered as 4-digit string. */
  readonly year: string;
  /** Anonymized scope label, already localized (EN fallback applied). */
  readonly context: string;
  /** Localized decision beat. */
  readonly decision: string;
  /** Localized consequence beat. */
  readonly consequence: string;
  /** Localized lesson beat. */
  readonly lesson: string;
};
