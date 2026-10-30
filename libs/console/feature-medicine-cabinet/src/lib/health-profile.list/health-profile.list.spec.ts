import { ConfirmDialogComponent } from '@portfolio/console/shared/ui';
import { of, Subject, throwError } from 'rxjs';
import HealthProfileNameDialog from '../health-profile.name-dialog/health-profile.name-dialog';
import {
  allByTestId,
  BO_ID,
  buttonByText,
  byTestId,
  click,
  httpError,
  ME_ID,
  openPage,
  pageText,
  textOf,
} from '../medicine-cabinet-testing.util';

// 'S4 Trang người' and 'S5 Hộp xóa người'. Expected values come from R7, R11, R13, 'ST-2 Xóa người' and the
// copy table ('P2 Trạng thái màn hình') of the medicine cabinet epic.

const PEOPLE_URL = '/medicine-cabinet/people';

const rowOf = (harness: Awaited<ReturnType<typeof openPage>>['harness'], name: string) =>
  allByTestId(harness, 'person-row').find((row) => textOf(byTestId(harness, 'person-name', row)) === name);

describe('HealthProfileList (S4)', () => {
  it('R11.12: lists "Bố", "Mẹ", "Owner" in that order', async () => {
    const { harness } = await openPage(PEOPLE_URL);

    expect(allByTestId(harness, 'person-name').map(textOf)).toEqual(['Bố', 'Mẹ', 'Owner']);
  });

  it('P2: with no people, shows "No people yet" and "Add person"', async () => {
    const { harness } = await openPage(PEOPLE_URL, (s) => s.listProfiles.mockReturnValue(of([])));

    expect(pageText(harness)).toContain('No people yet');
    expect(buttonByText(harness, 'Add person')).toBeDefined();
  });

  describe('S5 Hộp xóa người', () => {
    it('R7.3: "Mẹ" with 3 items asks "Mẹ has 3 items. They will be deleted too." with "Delete all"', async () => {
      const { harness, dialog } = await openPage(PEOPLE_URL);

      await click(harness, byTestId(harness, 'person-delete', rowOf(harness, 'Mẹ')));

      expect(dialog.dataOf(ConfirmDialogComponent)).toEqual(
        expect.objectContaining({
          title: 'Delete Mẹ?',
          message: 'Mẹ has 3 items. They will be deleted too.',
          confirmLabel: 'Delete all',
        })
      );
    });

    it('R7.5: "Bố" with no items asks "Bố has no items." with "Delete"', async () => {
      const { harness, dialog } = await openPage(PEOPLE_URL);

      await click(harness, byTestId(harness, 'person-delete', rowOf(harness, 'Bố')));

      expect(dialog.dataOf(ConfirmDialogComponent)).toEqual(
        expect.objectContaining({
          title: 'Delete Bố?',
          message: 'Bố has no items.',
          confirmLabel: 'Delete',
        })
      );
    });

    it('R7.4: "Delete all" deletes "Mẹ", shows "Person deleted" and reloads S4', async () => {
      const { harness, service, toast } = await openPage(PEOPLE_URL, (_s, d) =>
        d.results.set(ConfirmDialogComponent, true)
      );
      const loadsBefore = service.listProfiles.mock.calls.length;

      await click(harness, byTestId(harness, 'person-delete', rowOf(harness, 'Mẹ')));

      expect(service.deleteProfile).toHaveBeenCalledWith(ME_ID);
      expect(toast.success).toHaveBeenCalledWith('Person deleted');
      expect(service.listProfiles.mock.calls.length).toBeGreaterThan(loadsBefore);
    });

    it('ST-2 row 4: "Cancel" in S5 leaves S4 unchanged', async () => {
      const { harness, service } = await openPage(PEOPLE_URL, (_s, d) => d.results.set(ConfirmDialogComponent, false));

      await click(harness, byTestId(harness, 'person-delete', rowOf(harness, 'Mẹ')));

      expect(service.deleteProfile).not.toHaveBeenCalled();
      expect(allByTestId(harness, 'person-name').map(textOf)).toEqual(['Bố', 'Mẹ', 'Owner']);
    });

    it('R7.6: after the last person is deleted, S4 shows "No people yet"', async () => {
      const { harness } = await openPage(PEOPLE_URL, (s, d) => {
        d.results.set(ConfirmDialogComponent, true);
        s.listProfiles.mockReturnValueOnce(
          of([{ id: ME_ID, name: 'Owner', itemCount: 2, createdAt: '', updatedAt: '' }])
        );
        s.listProfiles.mockReturnValue(of([]));
      });

      await click(harness, byTestId(harness, 'person-delete', rowOf(harness, 'Owner')));

      expect(pageText(harness)).toContain('No people yet');
    });

    it.each(['Mẹ', 'Bố'])(
      'R13.3: while "%s" is being deleted, its Delete button is locked and only one request goes out',
      async (name) => {
        const { harness, service } = await openPage(PEOPLE_URL, (s, d) => {
          d.results.set(ConfirmDialogComponent, true);
          s.deleteProfile.mockReturnValue(new Subject());
        });

        await click(harness, byTestId(harness, 'person-delete', rowOf(harness, name)));
        await click(harness, byTestId(harness, 'person-delete', rowOf(harness, name)));

        expect(service.deleteProfile).toHaveBeenCalledTimes(1);
        expect((byTestId(harness, 'person-delete', rowOf(harness, name)) as HTMLButtonElement).disabled).toBe(true);
      }
    );

    it('R13.11: a 404 because "Bố" was deleted in another tab counts as done: "Person deleted", S4 reloads', async () => {
      const { harness, service, toast } = await openPage(PEOPLE_URL, (s, d) => {
        d.results.set(ConfirmDialogComponent, true);
        s.deleteProfile.mockReturnValue(throwError(() => httpError(404, { errorCode: 'HEALTH_PROFILE_NOT_FOUND' })));
      });
      const loadsBefore = service.listProfiles.mock.calls.length;

      await click(harness, byTestId(harness, 'person-delete', rowOf(harness, 'Bố')));

      expect(service.deleteProfile).toHaveBeenCalledWith(BO_ID);
      expect(toast.success).toHaveBeenCalledWith('Person deleted');
      expect(toast.error).not.toHaveBeenCalled();
      expect(service.listProfiles.mock.calls.length).toBeGreaterThan(loadsBefore);
    });
  });

  describe('S10 Hộp tên người, opened from S4', () => {
    it('R11.1: "Add person" opens S10 in add mode, and S4 reloads after "Bố" is saved', async () => {
      const { harness, service, dialog } = await openPage(PEOPLE_URL, (_s, d) =>
        d.results.set(HealthProfileNameDialog, { id: BO_ID, name: 'Bố' })
      );
      const loadsBefore = service.listProfiles.mock.calls.length;

      await click(harness, buttonByText(harness, 'Add person'));

      expect(dialog.dataOf(HealthProfileNameDialog)).toEqual({ mode: 'add' });
      expect(service.listProfiles.mock.calls.length).toBeGreaterThan(loadsBefore);
    });

    it('R11.3: renaming "Mẹ" opens S10 with her id and name', async () => {
      const { harness, dialog } = await openPage(PEOPLE_URL);

      await click(harness, byTestId(harness, 'person-rename', rowOf(harness, 'Mẹ')));

      expect(dialog.dataOf(HealthProfileNameDialog)).toEqual({ mode: 'rename', id: ME_ID, name: 'Mẹ' });
    });

    it('R11.10: "Cancel" in S10 opened from S4 changes nothing', async () => {
      const { harness, service, toast } = await openPage(PEOPLE_URL, (_s, d) =>
        d.results.set(HealthProfileNameDialog, undefined)
      );
      const loadsBefore = service.listProfiles.mock.calls.length;

      await click(harness, buttonByText(harness, 'Add person'));

      expect(service.createProfile).not.toHaveBeenCalled();
      expect(service.renameProfile).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(service.listProfiles.mock.calls.length).toBe(loadsBefore);
    });

    it('R13.12: when S10 reports that "Bố" no longer exists, S4 reloads', async () => {
      const { harness, service } = await openPage(PEOPLE_URL, (_s, d) =>
        d.results.set(HealthProfileNameDialog, 'missing')
      );
      const loadsBefore = service.listProfiles.mock.calls.length;

      await click(harness, byTestId(harness, 'person-rename', rowOf(harness, 'Bố')));

      expect(service.listProfiles.mock.calls.length).toBeGreaterThan(loadsBefore);
    });
  });
});
