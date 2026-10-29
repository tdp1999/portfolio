import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { By } from '@angular/platform-browser';
import { ConfirmDialogComponent } from '@portfolio/console/shared/ui';
import { of, Subject, throwError } from 'rxjs';
import {
  AIR_X_ID,
  allByTestId,
  buttonByText,
  byTestId,
  click,
  httpError,
  item,
  ME_ID,
  openPage,
  page,
  pageText,
  settle,
  textOf,
} from '../medicine-cabinet-testing.util';

// 'S1 Danh sách sản phẩm' and 'S3 Hộp xóa sản phẩm'. Expected values come from R1.6, R7, R10, R13 and the
// copy table ('P2 Trạng thái màn hình') of the medicine cabinet epic. The travel mark `item-travel` is
// rendered only on rows that carry the "Mang đi" label.

const LIST_URL = '/medicine-cabinet';

describe('MedicalItemList (S1)', () => {
  describe('R10 Thứ tự ở console', () => {
    it('R10.6: the row of "Air-X" shows "Simethicone" over "Air-X", then Person, Type, Travel and Updated', async () => {
      const { harness } = await openPage(LIST_URL);

      const [row] = allByTestId(harness, 'item-row');
      expect(textOf(byTestId(harness, 'item-primary', row))).toBe('Simethicone');
      expect(textOf(byTestId(harness, 'item-secondary', row))).toBe('Air-X');
      expect(textOf(byTestId(harness, 'item-person', row))).toBe('Owner');
      expect(textOf(byTestId(harness, 'item-type', row))).toBe('Medicine');
      expect(byTestId(harness, 'item-travel', row)).not.toBeNull();
      expect(byTestId(harness, 'item-updated', row)).not.toBeNull();
      expect(byTestId(harness, 'item-delete', row)).not.toBeNull();
    });

    it('R10.6: clicking the row opens S2 for that item', async () => {
      const { harness, router } = await openPage(LIST_URL);

      await click(harness, byTestId(harness, 'item-link'));

      expect(router.url).toBe(`/medicine-cabinet/${AIR_X_ID}/edit`);
    });

    it('R10.2: choosing "Mẹ" in the person filter lists only her items and writes ?person= to the URL', async () => {
      const { harness, service, router } = await openPage(LIST_URL);

      const filter = await TestbedHarnessEnvironment.loader(harness.fixture).getHarness(
        MatSelectHarness.with({ selector: '[data-testid="person-filter"]' })
      );
      await filter.open();
      await filter.clickOptions({ text: 'Mẹ' });
      await settle(harness);

      expect(router.url).toBe(`${LIST_URL}?person=${ME_ID}`);
      expect(service.listItems).toHaveBeenLastCalledWith(expect.objectContaining({ profileId: ME_ID }));
    });

    it('R10.8: reloading with ?person= of "Mẹ" keeps the URL and lists only her items', async () => {
      // A fresh page from the same URL stands for the browser reload.
      const { service, router } = await openPage(`${LIST_URL}?person=${ME_ID}`);

      expect(router.url).toBe(`${LIST_URL}?person=${ME_ID}`);
      expect(service.listItems).toHaveBeenLastCalledWith(expect.objectContaining({ profileId: ME_ID }));
    });

    it('R10.3: filtering on "Mẹ" with no items shows "Mẹ has no items yet", "Clear filter" and "Add item"', async () => {
      const { harness, service, router } = await openPage(`${LIST_URL}?person=${ME_ID}`, (s) => {
        s.listItems.mockReturnValue(of(page([])));
      });

      expect(pageText(harness)).toContain('Mẹ has no items yet');
      expect(buttonByText(harness, 'Add item')).toBeDefined();

      await click(harness, buttonByText(harness, 'Clear filter'));

      expect(router.url).toBe(LIST_URL);
      expect(service.listItems).toHaveBeenLastCalledWith(expect.not.objectContaining({ profileId: ME_ID }));
    });

    it('R10.7: with more items than one page, the paginator loads page 2; the page has no search box', async () => {
      const { harness, service } = await openPage(LIST_URL, (s) => s.listItems.mockReturnValue(of(page([item()], 45))));

      const paginator = harness.fixture.debugElement.query(By.css('console-paginator'));
      expect(paginator).not.toBeNull();
      expect(paginator.componentInstance.length()).toBe(45);
      paginator.componentInstance.page.emit({ pageIndex: 1, pageSize: 20 });
      await settle(harness);

      expect(service.listItems).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, limit: 20 }));
      expect(harness.fixture.nativeElement.querySelector('input[type="search"], console-filter-search')).toBeNull();
    });
  });

  describe('P2 Trạng thái màn hình', () => {
    it('P2, R7.6: with no items and no people, shows "No items yet" and "Add item"', async () => {
      const { harness } = await openPage(LIST_URL, (s) => {
        s.listItems.mockReturnValue(of(page([])));
        s.listProfiles.mockReturnValue(of([]));
      });

      expect(pageText(harness)).toContain('No items yet');
      expect(buttonByText(harness, 'Add item')).toBeDefined();
    });
  });

  describe('R7 Xóa có xác nhận (S3)', () => {
    it('R1.6: S3 asks "Delete Simethicone of Owner? This cannot be undone." with the button "Delete"', async () => {
      const { harness, dialog } = await openPage(LIST_URL);

      await click(harness, byTestId(harness, 'item-delete'));

      expect(dialog.dataOf(ConfirmDialogComponent)).toEqual(
        expect.objectContaining({
          title: 'Delete item?',
          message: 'Delete Simethicone of Owner? This cannot be undone.',
          confirmLabel: 'Delete',
        })
      );
    });

    it('R7.1: confirming deletes "Air-X", shows "Item deleted" and reloads the list', async () => {
      const { harness, service, toast, dialog } = await openPage(LIST_URL, (_s, d) => {
        d.results.set(ConfirmDialogComponent, true);
      });
      const loadsBefore = service.listItems.mock.calls.length;

      await click(harness, byTestId(harness, 'item-delete'));

      expect(dialog.openedTimes(ConfirmDialogComponent)).toBe(1);
      expect(service.deleteItem).toHaveBeenCalledWith(AIR_X_ID);
      expect(toast.success).toHaveBeenCalledWith('Item deleted');
      expect(service.listItems.mock.calls.length).toBeGreaterThan(loadsBefore);
    });

    it('R7.2: "Cancel" in S3 deletes nothing', async () => {
      const { harness, service } = await openPage(LIST_URL, (_s, d) => {
        d.results.set(ConfirmDialogComponent, false);
      });

      await click(harness, byTestId(harness, 'item-delete'));

      expect(service.deleteItem).not.toHaveBeenCalled();
    });

    it('R13.3: while the delete is being sent, the Delete button of the row is locked and only one request goes out', async () => {
      const pending = new Subject<{ success: boolean }>();
      const { harness, service } = await openPage(LIST_URL, (s, d) => {
        d.results.set(ConfirmDialogComponent, true);
        s.deleteItem.mockReturnValue(pending);
      });

      await click(harness, byTestId(harness, 'item-delete'));
      await click(harness, byTestId(harness, 'item-delete'));

      expect(service.deleteItem).toHaveBeenCalledTimes(1);
      expect((byTestId(harness, 'item-delete') as HTMLButtonElement).disabled).toBe(true);
    });

    it('R13.9: a 404 because "Air-X" was deleted on another device counts as done: "Item deleted", list reloads', async () => {
      const { harness, service, toast } = await openPage(LIST_URL, (s, d) => {
        d.results.set(ConfirmDialogComponent, true);
        s.deleteItem.mockReturnValue(throwError(() => httpError(404, { errorCode: 'MEDICAL_ITEM_NOT_FOUND' })));
      });
      const loadsBefore = service.listItems.mock.calls.length;

      await click(harness, byTestId(harness, 'item-delete'));

      expect(toast.success).toHaveBeenCalledWith('Item deleted');
      expect(toast.error).not.toHaveBeenCalled();
      expect(service.listItems.mock.calls.length).toBeGreaterThan(loadsBefore);
    });
  });
});
