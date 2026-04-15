/**
 * SUPERSEDED by profile-per-section.spec.ts (task 258).
 *
 * The profile page was refactored from a single-form-save model to per-section saves.
 * All tests in this file are replaced by the new spec which covers:
 * - Per-section save isolation (only the relevant PATCH fires)
 * - Validation with per-section error display
 * - Unsaved changes guard (Stay / Discard)
 * - Scrollspy rail active state and deep-linking
 * - Social links & certifications via per-section save
 * - Data persistence across refreshes
 */

export {};
