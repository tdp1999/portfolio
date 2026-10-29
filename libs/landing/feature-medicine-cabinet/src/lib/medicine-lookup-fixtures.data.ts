import type { MedicineLookupItem } from '@portfolio/shared/types';

// Test data of the medicine cabinet epic for 'S6 Trang tra cứu': Owner has 5 items, Mẹ has 3 (R5.1); 3 items
// carry "Mang đi", one of them is Mẹ's and one is "Air-X" (R14.1, R14.2, R14.6); both use Simethicone with
// different doses (R5.4). Bố has no item (R5.9).

export const OWNER_ID = '01a10b5b-9d90-753e-a6a3-0000000000a3';
export const ME_ID = '01a10b5b-9d90-753e-a6a3-0000000000a1';
const AT = '2026-10-01T00:00:00.000Z';

let seq = 0;
export const lookupItem = (overrides: Partial<MedicineLookupItem> = {}): MedicineLookupItem => ({
  id: `01a10b5b-9d90-753e-a6a3-${String(++seq).padStart(12, '0')}`,
  profileId: OWNER_ID,
  profileName: 'Owner',
  kind: 'MEDICINE',
  name: 'Item',
  activeIngredients: [],
  strength: null,
  dose: null,
  timing: null,
  usageType: null,
  purpose: null,
  note: null,
  packForTravel: false,
  createdAt: AT,
  updatedAt: AT,
  ...overrides,
});

const me = { profileId: ME_ID, profileName: 'Mẹ' };

export const OWNER_AIR_X = lookupItem({
  name: 'Air-X',
  activeIngredients: ['Simethicone'],
  strength: '80mg',
  dose: '1 viên x 3 lần/ngày',
  purpose: 'Đầy hơi, đau dạ dày',
  packForTravel: true,
  updatedAt: '2026-10-27T00:00:00.000Z',
});
export const ATORVASTATIN = lookupItem({
  name: 'Atorvastatin',
  activeIngredients: ['Atorvastatin'],
  strength: '10mg',
  dose: '1 viên x 1 lần/ngày',
  timing: 'AFTER_MEAL',
  usageType: 'LONG_TERM',
  packForTravel: true,
  updatedAt: '2026-10-20T00:00:00.000Z',
});
export const PANADOL = lookupItem({
  name: 'Panadol Extra',
  activeIngredients: ['Paracetamol', 'Caffeine'],
  strength: '500mg',
});
export const THERMOMETER = lookupItem({ kind: 'SUPPLY', name: 'Nhiệt kế điện tử' });
export const AMOXICILLIN = lookupItem({
  name: 'Amoxicillin',
  activeIngredients: ['Amoxicillin'],
  strength: '500mg',
  usageType: 'COURSE',
  note: 'uống sau ăn',
});
export const ME_AIR_X = lookupItem({
  ...me,
  name: 'Air-X',
  activeIngredients: ['Simethicone'],
  strength: '80mg',
  dose: '2 viên x 3 lần/ngày',
});
export const KEM_Z = lookupItem({
  ...me,
  name: 'Kem Z',
  strength: '1%',
  note: 'Không hợp: nổi mẩn sau 2 ngày',
  packForTravel: true,
});
export const MEN_TIEU_HOA = lookupItem({ ...me, name: 'Men tiêu hóa X', strength: '1 gói' });

export const OWNER_ITEMS = [OWNER_AIR_X, ATORVASTATIN, PANADOL, THERMOMETER, AMOXICILLIN];
export const ME_ITEMS = [ME_AIR_X, KEM_Z, MEN_TIEU_HOA];
export const ALL_ITEMS = [...OWNER_ITEMS, ...ME_ITEMS];
