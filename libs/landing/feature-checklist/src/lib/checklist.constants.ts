import type { ChecklistSaveState } from './checklist.types';

/** The checklist API. Requests under it carry the Owner's access token. */
export const CHECKLIST_API_PREFIX = '/api/checklist';

/** The lookup table's slug: `lookup.md` in the checklist folder of the ctx plugin. Every run's `tra X` refs point at it. */
export const CHECKLIST_LOOKUP_SLUG = 'lookup';

/** The lookup table the old sync pushed (`bang-tra.md`). Kept archived; its letters match `lookup`. */
export const CHECKLIST_OLD_LOOKUP_SLUG = 'bang-tra';

/** Where a project keeps its checklist profile, in its own repo. A new run's `📁 §N` names a section of it. */
export const CHECKLIST_PROFILE_FILE = '.context/checklist-profile.md';

/** Icon and words for each save state of a run page (see `ChecklistSaveState`). */
export const CHECKLIST_SAVE_STATES: Readonly<Record<ChecklistSaveState, { icon: string; label: string }>> = {
  saved: { icon: 'cloud-check', label: 'All changes saved' },
  pending: { icon: 'cloud-upload', label: 'Unsaved changes, saving in a moment' },
  saving: { icon: 'loader-circle', label: 'Saving…' },
  failed: { icon: 'cloud-alert', label: 'Last change not saved' },
  conflict: { icon: 'cloud-off', label: 'Saving stopped: this run changed elsewhere' },
};
