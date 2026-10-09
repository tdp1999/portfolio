import type { ChecklistSaveState } from './checklist.types';

/** The checklist API. Requests under it carry the Owner's access token. */
export const CHECKLIST_API_PREFIX = '/api/checklist';

/** The lookup table's slug: `bang-tra.md` in the workflow folder. Every run's `tra X` refs point at it. */
export const CHECKLIST_LOOKUP_SLUG = 'bang-tra';

/** Icon and words for each save state of a run page (see `ChecklistSaveState`). */
export const CHECKLIST_SAVE_STATES: Readonly<Record<ChecklistSaveState, { icon: string; label: string }>> = {
  saved: { icon: 'cloud-check', label: 'All changes saved' },
  pending: { icon: 'cloud-upload', label: 'Unsaved changes, saving in a moment' },
  saving: { icon: 'loader-circle', label: 'Saving…' },
  failed: { icon: 'cloud-alert', label: 'Last change not saved' },
  conflict: { icon: 'cloud-off', label: 'Saving stopped: this run changed elsewhere' },
};
