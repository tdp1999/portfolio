import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LandingLocaleService, landingIconProvider, provideIcons } from '@portfolio/landing/shared/ui';
import type { MedicineLookupItem } from '@portfolio/shared/types';
import { Observable, of, throwError } from 'rxjs';

import { MedicineCabinetService } from '../medicine-cabinet.service';
import { CONSOLE_URL } from '../medicine-cabinet.tokens';
import {
  ALL_ITEMS,
  AMOXICILLIN,
  ATORVASTATIN,
  KEM_Z,
  lookupItem,
  ME_ID,
  MEN_TIEU_HOA,
  PANADOL,
} from '../medicine-lookup-fixtures.data';
import MedicineLookupPage from './medicine-lookup';

/*
 * Expected values come from R1, R4–R7, R9, R14, R16, DT-2, DT-3, ST-1, P12 and the S6 copy table of the
 * medicine cabinet epic. The page renders in VI here. DOM contract the page must keep (row 5.1c):
 * - `input[type="search"]`; chips are `<button aria-pressed>` labelled with the person name or "Mang đi".
 * - `view-rows` and `view-cards` buttons; `lookup-results` carries `data-view="rows" | "cards"`.
 * - `person-group` (header text "{name} · {n} sản phẩm"); in rows view `subtable-medicine` and
 *   `subtable-supply` inside it.
 * - `lookup-item` per item, holding `item-primary`, `item-secondary` (only when there is one),
 *   `item-supply-badge`, `item-strength`, `item-dose`, `item-timing`, `item-usage`, `item-purpose`
 *   (only the fields that apply to the kind), `note-toggle` (only when there is a note, with
 *   `aria-expanded` and `aria-label`), `note` (only while open) and `edit-link` (an `<a href>`).
 * - Buttons "Xóa bộ lọc" and "Thử lại"; link "Mở console".
 * - `returnTo` is built from `location.origin` plus `router.url`. Under TestBed the router does not move
 *   `window.location`, so a `returnTo` built from `location.href` would miss the S6 path and query.
 */

const CONSOLE = 'https://console.test';
const VIEW_STORAGE_FAILS = new Error('storage disabled');

type Lookup = () => Observable<MedicineLookupItem[]>;

async function openPage(url = '/medicine-cabinet', lookup: Lookup = () => of(ALL_ITEMS)) {
  const service = { lookup: jest.fn(lookup) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'medicine-cabinet', component: MedicineLookupPage }]),
      { provide: MedicineCabinetService, useValue: service },
      { provide: LandingLocaleService, useValue: { locale: signal('vi') } },
      { provide: CONSOLE_URL, useValue: CONSOLE },
      provideIcons(landingIconProvider),
    ],
  });
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  await settle(harness);
  return { harness, service, router: TestBed.inject(Router) };
}

/** Recreates the page in a fresh TestBed, as when the Owner closes and reopens S6. */
async function reopen(url = '/medicine-cabinet', lookup?: Lookup) {
  TestBed.resetTestingModule();
  return openPage(url, lookup);
}

async function settle(harness: RouterTestingHarness, ms = 350) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  harness.fixture.detectChanges();
  await harness.fixture.whenStable();
  harness.fixture.detectChanges();
}

const root = (h: RouterTestingHarness) => h.fixture.nativeElement as HTMLElement;
const byTestId = (h: RouterTestingHarness, id: string, scope?: Element) =>
  (scope ?? root(h)).querySelector<HTMLElement>(`[data-testid="${id}"]`);
const allByTestId = (h: RouterTestingHarness, id: string, scope?: Element) =>
  Array.from((scope ?? root(h)).querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));
const textOf = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const pageText = (h: RouterTestingHarness) => textOf(root(h));
const buttonByText = (h: RouterTestingHarness, label: string) =>
  Array.from(root(h).querySelectorAll('button')).find((b) => textOf(b) === label);
const linkByText = (h: RouterTestingHarness, label: string) =>
  Array.from(root(h).querySelectorAll('a')).find((a) => textOf(a) === label);
const searchInput = (h: RouterTestingHarness) => root(h).querySelector<HTMLInputElement>('input[type="search"]');
// The view toggles may also be `aria-pressed` buttons; they are not chips.
const pressedChips = (h: RouterTestingHarness) =>
  Array.from(root(h).querySelectorAll('button[aria-pressed="true"]'))
    .filter((b) => !['view-rows', 'view-cards'].includes(b.getAttribute('data-testid') ?? ''))
    .map(textOf);

async function click(h: RouterTestingHarness, el: Element | null | undefined) {
  if (!el) throw new Error('element to click was not found');
  (el as HTMLElement).click();
  await settle(h);
}

async function search(h: RouterTestingHarness, q: string) {
  const input = searchInput(h);
  if (!input) throw new Error('the page has no search input');
  input.value = q;
  input.dispatchEvent(new Event('input'));
  await settle(h);
}

const groupHeaders = (h: RouterTestingHarness) =>
  allByTestId(h, 'person-group').map((g) => textOf(g).match(/^(.+? · \d+ sản phẩm)/)?.[1] ?? textOf(g));
const itemCount = (h: RouterTestingHarness) => allByTestId(h, 'lookup-item').length;
const group = (h: RouterTestingHarness, name: string) =>
  allByTestId(h, 'person-group').find((g) => textOf(g).startsWith(`${name} ·`));

/** The `lookup-item` whose primary name is `primary`, inside the group of `person` when given. */
function itemEl(h: RouterTestingHarness, primary: string, person?: string): HTMLElement {
  const scope = person ? group(h, person) : root(h);
  const found = allByTestId(h, 'lookup-item', scope ?? undefined).find(
    (el) => textOf(byTestId(h, 'item-primary', el)) === primary
  );
  if (!found) throw new Error(`no lookup item "${primary}"${person ? ` for ${person}` : ''}`);
  return found;
}

async function useView(h: RouterTestingHarness, view: 'rows' | 'cards') {
  await click(h, byTestId(h, view === 'rows' ? 'view-rows' : 'view-cards'));
  expect(byTestId(h, 'lookup-results')?.getAttribute('data-view')).toBe(view);
}

const VIEWS = ['rows', 'cards'] as const;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
  // R16.3 overrides scrollY; drop the override so later tests see the jsdom default again.
  delete (window as { scrollY?: number }).scrollY;
});

describe('MedicineLookupPage (S6)', () => {
  describe.each(VIEWS)('R1 Tên hiển thị, view %s', (view) => {
    it('R1.1: "Air-X" with ["Simethicone"] shows "Simethicone", then "Air-X"', async () => {
      const { harness } = await openPage();
      await useView(harness, view);
      expect(textOf(byTestId(harness, 'item-secondary', itemEl(harness, 'Simethicone', 'Owner')))).toBe('Air-X');
    });

    it('R1.2: "Panadol Extra" shows "Panadol Extra", then "Paracetamol + Caffeine"', async () => {
      const { harness } = await openPage();
      await useView(harness, view);
      expect(textOf(byTestId(harness, 'item-secondary', itemEl(harness, 'Panadol Extra')))).toBe(
        'Paracetamol + Caffeine'
      );
    });

    it('R1.3: "Men tiêu hóa X" with no ingredient has no secondary line', async () => {
      const { harness } = await openPage();
      await useView(harness, view);
      expect(byTestId(harness, 'item-secondary', itemEl(harness, 'Men tiêu hóa X'))).toBeNull();
    });

    it('R1.4: supply "Nhiệt kế điện tử" carries "Vật tư" and has no secondary line', async () => {
      const { harness } = await openPage();
      await useView(harness, view);
      const el = itemEl(harness, 'Nhiệt kế điện tử');
      expect(textOf(byTestId(harness, 'item-supply-badge', el))).toBe('Vật tư');
      expect(byTestId(harness, 'item-secondary', el)).toBeNull();
    });
  });

  describe('R4, R5 Tìm và lọc (ST-1)', () => {
    it('R5.1: Owner 5 and Mẹ 3 show the group "Mẹ" then "Owner", each with its count', async () => {
      const { harness } = await openPage();
      expect(groupHeaders(harness)).toEqual(['Mẹ · 3 sản phẩm', 'Owner · 5 sản phẩm']);
    });

    it('R4.5: "xyz" shows "Không tìm thấy sản phẩm nào" with its hint and "Xóa bộ lọc"', async () => {
      const { harness } = await openPage();
      await search(harness, 'xyz');
      expect(pageText(harness)).toContain('Không tìm thấy sản phẩm nào');
      expect(pageText(harness)).toContain('Thử từ khóa khác hoặc bỏ chip lọc.');
      expect(buttonByText(harness, 'Xóa bộ lọc')).toBeDefined();
    });

    it('R4.10: "nhuc dau" then "Xóa bộ lọc" empties the search, unselects chips and shows the full list A→Z', async () => {
      const { harness } = await openPage();
      await search(harness, 'nhuc dau');
      expect(pageText(harness)).toContain('Không tìm thấy sản phẩm nào');
      await click(harness, buttonByText(harness, 'Xóa bộ lọc'));
      expect(searchInput(harness)?.value).toBe('');
      expect(pressedChips(harness)).toEqual([]);
      expect(itemCount(harness)).toBe(8);
      expect(groupHeaders(harness)).toEqual(['Mẹ · 3 sản phẩm', 'Owner · 5 sản phẩm']);
      // A→Z by display name inside each sub-table: "Thuốc", then "Vật tư" (R5.5, R6.7).
      const owner = group(harness, 'Owner');
      const primaries = (subtable: string) =>
        allByTestId(harness, 'item-primary', byTestId(harness, subtable, owner) ?? undefined).map(textOf);
      expect(primaries('subtable-medicine')).toEqual(['Amoxicillin', 'Atorvastatin', 'Panadol Extra', 'Simethicone']);
      expect(primaries('subtable-supply')).toEqual(['Nhiệt kế điện tử']);
    });

    it('R5.7: chip "Mẹ" and "atorvastatin" match nothing; "Xóa bộ lọc" shows both groups with 8 items', async () => {
      const { harness } = await openPage();
      await click(harness, buttonByText(harness, 'Mẹ'));
      await search(harness, 'atorvastatin');
      expect(pageText(harness)).toContain('Không tìm thấy sản phẩm nào');
      await click(harness, buttonByText(harness, 'Xóa bộ lọc'));
      expect(pressedChips(harness)).toEqual([]);
      expect(searchInput(harness)?.value).toBe('');
      expect(allByTestId(harness, 'person-group')).toHaveLength(2);
      expect(itemCount(harness)).toBe(8);
    });

    it('ST-1 row 7: from no result, shortening the keyword until it matches shows results again', async () => {
      const { harness } = await openPage();
      await search(harness, 'simethiconexx');
      expect(pageText(harness)).toContain('Không tìm thấy sản phẩm nào');
      await search(harness, 'simethicone');
      expect(pageText(harness)).not.toContain('Không tìm thấy sản phẩm nào');
      expect(itemCount(harness)).toBe(2);
    });

    it('R5.8: chip "Owner" replaces chip "Mẹ"; pressing "Owner" again unselects it', async () => {
      const { harness } = await openPage();
      await click(harness, buttonByText(harness, 'Mẹ'));
      await click(harness, buttonByText(harness, 'Owner'));
      expect(pressedChips(harness)).toEqual(['Owner']);
      expect(groupHeaders(harness)).toEqual(['Owner · 5 sản phẩm']);
      await click(harness, buttonByText(harness, 'Owner'));
      expect(pressedChips(harness)).toEqual([]);
      expect(allByTestId(harness, 'person-group')).toHaveLength(2);
    });

    it('R5.8 (ST-1 row 5): pressing the selected chip again keeps the keyword', async () => {
      const { harness } = await openPage();
      await search(harness, 'simethicone');
      await click(harness, buttonByText(harness, 'Mẹ'));
      await click(harness, buttonByText(harness, 'Mẹ'));
      expect(searchInput(harness)?.value).toBe('simethicone');
      expect(itemCount(harness)).toBe(2);
    });
  });

  describe('R6 Bộ field', () => {
    it('R6.1, R6.2: "Atorvastatin" (AFTER_MEAL, LONG_TERM) shows "Sau ăn" and "Dùng lâu dài"', async () => {
      const { harness } = await openPage();
      const el = itemEl(harness, ATORVASTATIN.name);
      expect(textOf(byTestId(harness, 'item-timing', el))).toBe('Sau ăn');
      expect(textOf(byTestId(harness, 'item-usage', el))).toBe('Dùng lâu dài');
    });

    it('R6.10: "Amoxicillin" (COURSE) shows "Dùng theo đợt"', async () => {
      const { harness } = await openPage();
      expect(textOf(byTestId(harness, 'item-usage', itemEl(harness, AMOXICILLIN.name)))).toBe('Dùng theo đợt');
    });

    it('R6.4: the row of "Atorvastatin" shows "10mg" and "1 viên x 1 lần/ngày"', async () => {
      const { harness } = await openPage();
      const el = itemEl(harness, ATORVASTATIN.name);
      expect(textOf(byTestId(harness, 'item-strength', el))).toBe('10mg');
      expect(textOf(byTestId(harness, 'item-dose', el))).toBe('1 viên x 1 lần/ngày');
    });

    it('R6.5: the note icon opens the note under the row, then closes it, and aria-expanded follows', async () => {
      const { harness } = await openPage();
      const el = () => itemEl(harness, KEM_Z.name);
      const toggle = () => byTestId(harness, 'note-toggle', el());
      expect(toggle()?.getAttribute('aria-expanded')).toBe('false');
      expect(toggle()?.getAttribute('aria-label')).toBe('Xem ghi chú');
      expect(pageText(harness)).not.toContain('Không hợp: nổi mẩn sau 2 ngày');
      await click(harness, toggle());
      expect(toggle()?.getAttribute('aria-expanded')).toBe('true');
      expect(toggle()?.getAttribute('aria-label')).toBe('Ẩn ghi chú');
      expect(textOf(byTestId(harness, 'note', group(harness, 'Mẹ')))).toBe('Không hợp: nổi mẩn sau 2 ngày');
      await click(harness, toggle());
      expect(toggle()?.getAttribute('aria-expanded')).toBe('false');
      expect(byTestId(harness, 'note')).toBeNull();
    });

    it('R6.6: a medicine with no dose shows "Chưa ghi" in the dose column', async () => {
      const { harness } = await openPage();
      expect(textOf(byTestId(harness, 'item-dose', itemEl(harness, MEN_TIEU_HOA.name)))).toBe('Chưa ghi');
    });

    it('R6.7: a group with medicines and supplies has "Thuốc" then "Vật tư"; a group of medicines only has no "Vật tư"', async () => {
      const { harness } = await openPage();
      await useView(harness, 'rows');
      const owner = group(harness, 'Owner');
      const medicine = byTestId(harness, 'subtable-medicine', owner);
      const supply = byTestId(harness, 'subtable-supply', owner);
      expect(textOf(medicine)).toContain('Thuốc');
      expect(textOf(supply)).toContain('Vật tư');
      expect(medicine?.compareDocumentPosition(supply as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(byTestId(harness, 'item-dose', supply ?? undefined)).toBeNull();
      expect(byTestId(harness, 'subtable-supply', group(harness, 'Mẹ'))).toBeNull();
    });

    it('R6.9: "Atorvastatin" with no note has no note icon', async () => {
      const { harness } = await openPage();
      expect(byTestId(harness, 'note-toggle', itemEl(harness, ATORVASTATIN.name))).toBeNull();
    });
  });

  describe.each(VIEWS)('DT-2 Field ở tra cứu, view %s (R6.8)', (view) => {
    const NOTE = 'Ghi chú thử';
    const FULL_MEDICINE = {
      kind: 'MEDICINE' as const,
      activeIngredients: [],
      strength: '10mg',
      dose: '1 viên',
      timing: 'AFTER_MEAL' as const,
      usageType: 'LONG_TERM' as const,
      purpose: 'Mỡ máu',
    };
    const rows: [string, Partial<MedicineLookupItem>, { subtable: string; missing: string | null; note: boolean }][] = [
      [
        'row 1 (R6.4, R6.9): medicine, nothing empty, no note',
        { ...FULL_MEDICINE },
        { subtable: 'subtable-medicine', missing: null, note: false },
      ],
      [
        'row 2 (R6.5): medicine, nothing empty, note',
        { ...FULL_MEDICINE, note: NOTE },
        { subtable: 'subtable-medicine', missing: null, note: true },
      ],
      [
        'row 3 (R6.6): medicine, dose empty, no note',
        { ...FULL_MEDICINE, dose: null },
        { subtable: 'subtable-medicine', missing: 'item-dose', note: false },
      ],
      [
        'row 4 [Owner]: medicine, dose empty, note',
        { ...FULL_MEDICINE, dose: null, note: NOTE },
        { subtable: 'subtable-medicine', missing: 'item-dose', note: true },
      ],
      [
        'row 5 (R6.7): supply, nothing empty, no note',
        { kind: 'SUPPLY', purpose: 'Đo nhiệt độ' },
        { subtable: 'subtable-supply', missing: null, note: false },
      ],
      [
        'row 6 [Owner]: supply, purpose empty, note',
        { kind: 'SUPPLY', purpose: null, note: NOTE },
        { subtable: 'subtable-supply', missing: 'item-purpose', note: true },
      ],
    ];

    it.each(rows)('%s', async (_label, overrides, expected) => {
      const item = lookupItem({ name: 'Mẫu', ...overrides });
      const { harness } = await openPage('/medicine-cabinet', () => of([item]));
      await useView(harness, view);
      const el = () => itemEl(harness, 'Mẫu');

      if (view === 'rows') expect(byTestId(harness, expected.subtable)?.contains(el())).toBe(true);
      if (item.kind === 'SUPPLY') {
        for (const medicineField of ['item-strength', 'item-dose', 'item-timing', 'item-usage']) {
          expect(byTestId(harness, medicineField, el())).toBeNull();
        }
      }
      if (expected.missing) expect(textOf(byTestId(harness, expected.missing, el()))).toBe('Chưa ghi');
      else expect(textOf(el())).not.toContain('Chưa ghi');

      const toggle = () => byTestId(harness, 'note-toggle', el());
      if (!expected.note) {
        expect(toggle()).toBeNull();
        return;
      }
      await click(harness, toggle());
      expect(textOf(byTestId(harness, 'note'))).toBe(NOTE);
      await click(harness, toggle());
      expect(byTestId(harness, 'note')).toBeNull();
    });
  });

  describe('R9 Chế độ xem', () => {
    it('R9.1: the first visit shows rows', async () => {
      const { harness } = await openPage();
      expect(byTestId(harness, 'lookup-results')?.getAttribute('data-view')).toBe('rows');
    });

    it('R9.2: after choosing mini cards, reopening the page shows mini cards', async () => {
      const { harness } = await openPage();
      await useView(harness, 'cards');
      const reopened = await reopen();
      expect(byTestId(reopened.harness, 'lookup-results')?.getAttribute('data-view')).toBe('cards');
    });

    it('R9.3: if localStorage throws, the page shows rows', async () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw VIEW_STORAGE_FAILS;
      });
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw VIEW_STORAGE_FAILS;
      });
      const { harness } = await openPage();
      expect(byTestId(harness, 'lookup-results')?.getAttribute('data-view')).toBe('rows');
      await useView(harness, 'cards');
    });
  });

  describe('R7.6, R14 Trạng thái trống', () => {
    it('R7.6: with no item, S6 shows "Chưa có sản phẩm nào" and "Mở console"', async () => {
      const { harness } = await openPage('/medicine-cabinet', () => of([]));
      expect(pageText(harness)).toContain('Chưa có sản phẩm nào');
      expect(pageText(harness)).toContain('Thêm sản phẩm ở console.');
      expect(linkByText(harness, 'Mở console')?.getAttribute('href')).toContain(CONSOLE);
    });

    it('R14.3: with no travel label, the chip "Mang đi" shows "Chưa có sản phẩm mang đi" and "Mở console"', async () => {
      const noTravel = ALL_ITEMS.map((i) => ({ ...i, packForTravel: false }));
      const { harness } = await openPage('/medicine-cabinet', () => of(noTravel));
      await click(harness, buttonByText(harness, 'Mang đi'));
      expect(pageText(harness)).toContain('Chưa có sản phẩm mang đi');
      expect(pageText(harness)).toContain('Gắn nhãn Mang đi cho sản phẩm ở console.');
      expect(linkByText(harness, 'Mở console')?.getAttribute('href')).toContain(CONSOLE);
    });

    it('R14.7: Owner has travel items and Mẹ has none; "Mang đi" and "Mẹ" show "Không tìm thấy sản phẩm nào"', async () => {
      const meNoTravel = ALL_ITEMS.map((i) => (i.profileId === ME_ID ? { ...i, packForTravel: false } : i));
      const { harness } = await openPage('/medicine-cabinet', () => of(meNoTravel));
      await click(harness, buttonByText(harness, 'Mang đi'));
      await click(harness, buttonByText(harness, 'Mẹ'));
      expect(pageText(harness)).toContain('Không tìm thấy sản phẩm nào');
      expect(pageText(harness)).not.toContain('Chưa có sản phẩm mang đi');
      expect(buttonByText(harness, 'Xóa bộ lọc')).toBeDefined();
    });
  });

  describe('R16 Sửa từ tra cứu', () => {
    it('R16.1: the edit icon links to the console edit page, with returnTo = the full S6 URL', async () => {
      const { harness } = await openPage(`/medicine-cabinet?q=simethicone&person=${ME_ID}`);
      await search(harness, 'simethicone');
      const href =
        itemEl(harness, 'Simethicone', 'Mẹ')
          .querySelector<HTMLAnchorElement>('[data-testid="edit-link"]')
          ?.getAttribute('href') ?? '';
      const url = new URL(href);
      expect(url.origin).toBe(CONSOLE);
      expect(url.pathname).toMatch(/^\/medicine-cabinet\/[^/]+\/edit$/);
      const returnTo = new URL(url.searchParams.get('returnTo') ?? '');
      expect(returnTo.protocol).toMatch(/^https?:$/);
      expect(returnTo.pathname).toBe('/medicine-cabinet');
      expect(returnTo.searchParams.get('q')).toBe('simethicone');
      expect(returnTo.searchParams.get('person')).toBe(ME_ID);
    });

    it('R16.3: the edit icon saves the scroll position in sessionStorage; reopening scrolls back to it', async () => {
      const { harness } = await openPage();
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 });
      const stopNavigation = (e: Event) => e.preventDefault();
      document.addEventListener('click', stopNavigation);
      await click(harness, byTestId(harness, 'edit-link', itemEl(harness, PANADOL.name)));
      document.removeEventListener('click', stopNavigation);
      expect(sessionStorage.length).toBeGreaterThan(0);

      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
      const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
      await reopen();
      const calls = scrollTo.mock.calls.map((args) =>
        typeof args[0] === 'object' ? (args[0] as ScrollToOptions).top : args[1]
      );
      expect(calls).toContain(1200);
    });
  });

  describe('DT-3, P2 Lỗi', () => {
    it('DT-3 USER: a 403 shows "Tài khoản này không xem được trang này" with no "Thử lại"', async () => {
      const { harness } = await openPage('/medicine-cabinet', () =>
        throwError(() => new HttpErrorResponse({ status: 403 }))
      );
      expect(pageText(harness)).toContain('Tài khoản này không xem được trang này');
      expect(buttonByText(harness, 'Thử lại')).toBeUndefined();
    });

    it('P2: a 500 shows "Không tải được" and "Thử lại", which calls the lookup again', async () => {
      const { harness, service } = await openPage('/medicine-cabinet', () =>
        throwError(() => new HttpErrorResponse({ status: 500 }))
      );
      expect(pageText(harness)).toContain('Không tải được');
      await click(harness, buttonByText(harness, 'Thử lại'));
      expect(service.lookup).toHaveBeenCalledTimes(2);
    });
  });

  describe('P12 Lọc trên URL', () => {
    it('P12: typing a keyword puts ?q= on the URL with replaceUrl', async () => {
      const { harness, router } = await openPage();
      const navigate = jest.spyOn(router, 'navigateByUrl');
      await search(harness, 'simethicone');
      expect(router.url).toContain('q=simethicone');
      expect(navigate.mock.calls.some(([, extras]) => extras?.replaceUrl === true)).toBe(true);
    });

    it('P12: recreating the page from the URL keeps the keyword and the chip', async () => {
      const { harness } = await openPage(`/medicine-cabinet?q=simethicone&person=${ME_ID}`);
      expect(searchInput(harness)?.value).toBe('simethicone');
      expect(pressedChips(harness)).toEqual(['Mẹ']);
      expect(itemCount(harness)).toBe(1);
      expect(group(harness, 'Owner')).toBeUndefined();
    });

    it('P12: ?travel=1 selects the chip "Mang đi"', async () => {
      const { harness } = await openPage('/medicine-cabinet?travel=1');
      expect(pressedChips(harness)).toEqual(['Mang đi']);
      expect(itemCount(harness)).toBe(3);
    });
  });
});
