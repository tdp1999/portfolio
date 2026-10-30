import type { MedicineLookupItem, MedicineTiming, MedicineUsageType } from '@portfolio/shared/types';
import { medicalItemDisplay, normalizeForSearch } from '@portfolio/shared/utils/lite';

export interface LookupFilter {
  /** Raw keyword from the search box or `?q=`. */
  q: string;
  /** Selected person chip, or `null`. */
  personId: string | null;
  /** The "Mang đi" chip. */
  travel: boolean;
}

export interface PersonGroup {
  personId: string;
  personName: string;
  items: MedicineLookupItem[];
}

export interface PersonChip {
  id: string;
  name: string;
}

const byVietnamese = (a: string, b: string) => a.localeCompare(b, 'vi');

/** Name, active ingredients and purpose are searched; the note is not (R4). Partial, case- and accent-free (P11). */
function matchesKeyword(item: MedicineLookupItem, keyword: string): boolean {
  const haystack = [item.name, ...item.activeIngredients, item.purpose ?? ''].map(normalizeForSearch);
  return haystack.some((text) => text.includes(keyword));
}

export function filterLookup(items: readonly MedicineLookupItem[], filter: LookupFilter): MedicineLookupItem[] {
  const keyword = normalizeForSearch(filter.q.trim());
  return items.filter(
    (item) =>
      (!filter.personId || item.profileId === filter.personId) &&
      (!filter.travel || item.packForTravel) &&
      (!keyword || matchesKeyword(item, keyword))
  );
}

/** One group per person who has items, people A→Z, items A→Z by display name (R5.1, R5.5, R5.10). */
export function groupByPerson(items: readonly MedicineLookupItem[]): PersonGroup[] {
  const groups = new Map<string, PersonGroup>();
  for (const item of items) {
    const group = groups.get(item.profileId) ?? { personId: item.profileId, personName: item.profileName, items: [] };
    group.items.push(item);
    groups.set(item.profileId, group);
  }
  const displayName = (item: MedicineLookupItem) => medicalItemDisplay(item).primary;
  return [...groups.values()]
    .map((group) => ({ ...group, items: group.items.sort((a, b) => byVietnamese(displayName(a), displayName(b))) }))
    .sort((a, b) => byVietnamese(a.personName, b.personName));
}

/** A chip for each person who has items, A→Z (R5.9). */
export function personChips(items: readonly MedicineLookupItem[]): PersonChip[] {
  return groupByPerson(items).map(({ personId, personName }) => ({ id: personId, name: personName }));
}

/** One field cell of an item: `value` is `null` when the field applies to the kind but was left empty. */
export interface LookupField {
  testId: 'item-strength' | 'item-dose' | 'item-timing' | 'item-usage' | 'item-purpose';
  label: string;
  value: string | null;
}

/** An item as 'S6 Trang tra cứu' renders it, in rows view and in cards view alike. */
export interface LookupRow {
  id: string;
  primary: string;
  secondary: string | null;
  isSupply: boolean;
  /** Only the fields of the item's kind (R6.8): a supply has no medicine field. */
  fields: LookupField[];
  note: string | null;
  noteOpen: boolean;
  editHref: string;
  /** Accessible name of the edit icon: "Sửa {item}". */
  editLabel: string;
}

export interface LookupGroup {
  personId: string;
  heading: string;
  /** Every item, A→Z, for cards view. */
  items: LookupRow[];
  /** Rows view: "Thuốc" first, then "Vật tư"; a sub-table with no item is left out (R6.7). */
  subtables: LookupSubtable[];
}

export interface LookupSubtable {
  testId: 'subtable-medicine' | 'subtable-supply';
  heading: string;
  /** Header of every column but the last (the note and edit icons). */
  columns: string[];
  rows: LookupRow[];
}

/** Locale-resolved words a row needs, so building rows stays pure. */
export interface LookupRowCopy {
  fieldLabels: Record<LookupField['testId'], string>;
  timing: Record<MedicineTiming, string>;
  usage: Record<MedicineUsageType, string>;
}

/** The console edit page of an item, with the S6 URL to come back to (R16.1). */
export function editHref(consoleUrl: string, itemId: string, returnTo: string): string {
  const url = new URL(`/medicine-cabinet/${itemId}/edit`, consoleUrl);
  url.searchParams.set('returnTo', returnTo);
  return url.toString();
}

export function toLookupRow(
  item: MedicineLookupItem,
  copy: LookupRowCopy,
  edit: { href: string; label: string },
  noteOpen: boolean
): LookupRow {
  const display = medicalItemDisplay(item);
  const field = (testId: LookupField['testId'], value: string | null): LookupField => ({
    testId,
    label: copy.fieldLabels[testId],
    value,
  });
  const fields = display.isSupply
    ? [field('item-purpose', item.purpose)]
    : [
        field('item-strength', item.strength),
        field('item-dose', item.dose),
        field('item-timing', item.timing ? copy.timing[item.timing] : null),
        field('item-usage', item.usageType ? copy.usage[item.usageType] : null),
        field('item-purpose', item.purpose),
      ];
  return { id: item.id, ...display, fields, note: item.note, noteOpen, editHref: edit.href, editLabel: edit.label };
}
