import { filterLookup, groupByPerson, LookupFilter, personChips } from './medicine-lookup.util';
import {
  ALL_ITEMS,
  AMOXICILLIN,
  KEM_Z,
  lookupItem,
  ME_AIR_X,
  ME_ID,
  OWNER_AIR_X,
  OWNER_ID,
} from './medicine-lookup-fixtures.data';

// Expected values come from R4, R5, R14 and 'P11 Khớp một phần' of the medicine cabinet epic.

const NO_FILTER: LookupFilter = { q: '', personId: null, travel: false };
const filter = (f: Partial<LookupFilter>) => filterLookup(ALL_ITEMS, { ...NO_FILTER, ...f });
const ids = (items: { id: string }[]) => items.map((i) => i.id).sort();

describe('filterLookup', () => {
  describe('R4 Tìm kiếm', () => {
    it('R4.1: "da day" finds an item whose purpose is "Đau dạ dày"', () => {
      const stomach = lookupItem({ name: 'Thuốc dạ dày', purpose: 'Đau dạ dày' });
      const found = filterLookup([...ALL_ITEMS, stomach], { ...NO_FILTER, q: 'da day' });
      expect(ids(found)).toEqual(ids([OWNER_AIR_X, stomach]));
    });

    it('R4.2: "SIMETHICON" matches the active ingredient "Simethicone"', () => {
      expect(ids(filter({ q: 'SIMETHICON' }))).toEqual(ids([OWNER_AIR_X, ME_AIR_X]));
    });

    it('R4.3: "simethicone" finds "Air-X"', () => {
      expect(filter({ q: 'simethicone' }).map((i) => i.name)).toContain('Air-X');
    });

    it('R4.4: "sau an" does not find an item that has those words only in its note', () => {
      // Only the note of "Amoxicillin" ("uống sau ăn") holds these words.
      expect(AMOXICILLIN.note).toBe('uống sau ăn');
      expect(filter({ q: 'sau an' })).toEqual([]);
    });

    it('R4.9: "AIR-X" matches the product name "Air-X"', () => {
      expect(ids(filter({ q: 'AIR-X' }))).toEqual(ids([OWNER_AIR_X, ME_AIR_X]));
    });

    it('P11: "sime" matches part of "Simethicone"', () => {
      expect(ids(filter({ q: 'sime' }))).toEqual(ids([OWNER_AIR_X, ME_AIR_X]));
    });

    it('R4.5: "xyz" matches nothing', () => {
      expect(filter({ q: 'xyz' })).toEqual([]);
    });
  });

  describe('R5 Nhóm theo người', () => {
    it('R5.2: the chip "Mẹ" keeps only her 3 items', () => {
      expect(filter({ personId: ME_ID })).toHaveLength(3);
      expect(filter({ personId: ME_ID }).every((i) => i.profileId === ME_ID)).toBe(true);
    });

    it('R5.3: the chip "Mẹ" with "simethicone" keeps only her matching item', () => {
      expect(ids(filter({ personId: ME_ID, q: 'simethicone' }))).toEqual(ids([ME_AIR_X]));
    });

    it('R5.4: "simethicone" keeps the item of each person with that person\'s dose', () => {
      const doses = filter({ q: 'simethicone' }).map((i) => [i.profileName, i.dose]);
      expect(doses).toEqual(
        expect.arrayContaining([
          ['Owner', '1 viên x 3 lần/ngày'],
          ['Mẹ', '2 viên x 3 lần/ngày'],
        ])
      );
    });

    it('R5.7: the chip "Mẹ" with "atorvastatin" matches nothing', () => {
      expect(filter({ personId: ME_ID, q: 'atorvastatin' })).toEqual([]);
    });
  });

  describe('R14 Nhãn Mang đi', () => {
    it('R14.1: the chip "Mang đi" keeps the 3 labelled items', () => {
      expect(filter({ travel: true })).toHaveLength(3);
    });

    it('R14.2: "Mang đi" with the chip "Mẹ" keeps 1 item', () => {
      expect(ids(filter({ travel: true, personId: ME_ID }))).toEqual(ids([KEM_Z]));
    });

    it('R14.6: "Mang đi" with "simethicone" keeps 1 item', () => {
      expect(ids(filter({ travel: true, q: 'simethicone' }))).toEqual(ids([OWNER_AIR_X]));
    });
  });
});

describe('groupByPerson', () => {
  it('R5.1: Owner 5 and Mẹ 3 give the group "Mẹ" then "Owner", with 3 and 5 items', () => {
    expect(groupByPerson(ALL_ITEMS).map((g) => [g.personName, g.items.length])).toEqual([
      ['Mẹ', 3],
      ['Owner', 5],
    ]);
  });

  it('R5.5: inside a group, items are A→Z by display name, not by updatedAt', () => {
    const owner = groupByPerson(ALL_ITEMS).find((g) => g.personId === OWNER_ID);
    // Display names (DT-1): Amoxicillin, Atorvastatin, Nhiệt kế điện tử, Panadol Extra, Simethicone ("Air-X").
    expect(owner?.items.map((i) => i.name)).toEqual([
      'Amoxicillin',
      'Atorvastatin',
      'Nhiệt kế điện tử',
      'Panadol Extra',
      'Air-X',
    ]);
  });

  it('R5.6: "Dầu gió Z", "Đường glucose", "Zinc" keep the Vietnamese order ("Đ" after "D")', () => {
    const items = ['Zinc', 'Đường glucose', 'Dầu gió Z'].map((name) => lookupItem({ name }));
    expect(groupByPerson(items)[0].items.map((i) => i.name)).toEqual(['Dầu gió Z', 'Đường glucose', 'Zinc']);
  });

  it('R5.10: after "atorvastatin", the group "Mẹ" has no item and is hidden', () => {
    const groups = groupByPerson(filter({ q: 'atorvastatin' }));
    expect(groups.map((g) => g.personName)).toEqual(['Owner']);
  });
});

describe('personChips', () => {
  it('R5.9: only people with items get a chip, A→Z ("Bố" has none)', () => {
    expect(personChips(ALL_ITEMS)).toEqual([
      { id: ME_ID, name: 'Mẹ' },
      { id: OWNER_ID, name: 'Owner' },
    ]);
  });
});
