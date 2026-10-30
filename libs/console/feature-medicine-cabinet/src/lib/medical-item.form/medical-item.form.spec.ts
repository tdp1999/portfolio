import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { FormArray, FormControl } from '@angular/forms';
import { MatSelectHarness } from '@angular/material/select/testing';
import { UnsavedChangesDialog } from '@portfolio/console/shared/ui';
import { ValidationErrorService } from '@portfolio/console/shared/util';
import { of, Subject, throwError } from 'rxjs';
import HealthProfileNameDialog from '../health-profile.name-dialog/health-profile.name-dialog';
import {
  AIR_X_ID,
  BO_ID,
  buttonByText,
  click,
  fieldError,
  formOf,
  httpError,
  item,
  LANDING,
  ME_ID,
  openPage,
  Page,
  pageText,
  PEOPLE,
  settle,
  typeInto,
} from '../medicine-cabinet-testing.util';

// 'S2 Form sản phẩm'. Expected values come from R2.3, R3, R7.6, R11, R13, R14, R16, 'P3 Lỗi API', 'P8 Đổi
// loại' and the BVA table of the medicine cabinet epic. The form is read through its `FormGroupDirective`;
// `kind` is changed through the form control, because the epic does not fix the widget of that input.

const NEW_URL = '/medicine-cabinet/new';
const EDIT_URL = `/medicine-cabinet/${AIR_X_ID}/edit`;
const LIST_URL = '/medicine-cabinet';
const RETURN_TO = `${LANDING}/medicine-cabinet?q=simethicone&person=${ME_ID}`;
const withReturnTo = (url: string, returnTo = RETURN_TO) => `${url}?returnTo=${encodeURIComponent(returnTo)}`;
const MEDICINE_ONLY_FIELDS = ['activeIngredients', 'strength', 'dose', 'timing', 'usageType'];

const personSelect = async ({ harness }: Page) =>
  TestbedHarnessEnvironment.loader(harness.fixture).getHarness(
    MatSelectHarness.with({ selector: '[data-testid="person-select"]' })
  );

async function choosePerson(p: Page, label: string) {
  const select = await personSelect(p);
  await select.open();
  await select.clickOptions({ text: label });
  await settle(p.harness, 0);
}

async function personOptions(p: Page): Promise<string[]> {
  const select = await personSelect(p);
  await select.open();
  const options = await Promise.all((await select.getOptions()).map((o) => o.getText()));
  await select.close();
  return options;
}

const setKind = async (p: Page, kind: 'MEDICINE' | 'SUPPLY') => {
  formOf(p.harness).get('kind')?.setValue(kind);
  await settle(p.harness, 0);
};

/** Fills 'R3.1': "Mẹ", "Thuốc", "Atorvastatin", "10mg". */
async function fillAtorvastatin(p: Page) {
  await choosePerson(p, 'Mẹ');
  await typeInto(p.harness, 'name', 'Atorvastatin');
  await typeInto(p.harness, 'strength', '10mg');
}

const save = (p: Page) => click(p.harness, buttonByText(p.harness, 'Save'));
const lastCreatePayload = (p: Page) => p.service.createItem.mock.calls.at(-1)?.[0];

describe('MedicalItemForm (S2)', () => {
  describe('R3 Field bắt buộc', () => {
    it('R3.5, R14.4: the create form starts with "Thuốc" selected and "Mang đi" off', async () => {
      const p = await openPage(NEW_URL);

      expect(formOf(p.harness).value).toMatchObject({ kind: 'MEDICINE', packForTravel: false });
    });

    it('R3.1: saving "Atorvastatin" 10mg for "Mẹ" creates it, shows "Item saved" and goes back to S1', async () => {
      const p = await openPage(NEW_URL);

      await fillAtorvastatin(p);
      await save(p);

      expect(lastCreatePayload(p)).toMatchObject({
        profileId: ME_ID,
        kind: 'MEDICINE',
        name: 'Atorvastatin',
        strength: '10mg',
      });
      expect(p.toast.success).toHaveBeenCalledWith('Item saved');
      expect(p.router.url).toBe(LIST_URL);
    });

    it.each([
      ['an empty name', ''],
      ['a name of only spaces (P10)', '   '],
    ])('R3.2: %s shows "Name is required", sends nothing and keeps the other fields', async (_label, name) => {
      const p = await openPage(NEW_URL);
      await fillAtorvastatin(p);

      await typeInto(p.harness, 'name', name);
      await save(p);

      expect(fieldError(p.harness, 'name')).toContain('Name is required');
      expect(p.service.createItem).not.toHaveBeenCalled();
      expect(formOf(p.harness).value).toMatchObject({ profileId: ME_ID, strength: '10mg' });
    });

    it('R3.3: a medicine without strength shows "Strength is required" and sends nothing', async () => {
      const p = await openPage(NEW_URL);
      await choosePerson(p, 'Mẹ');
      await typeInto(p.harness, 'name', 'Atorvastatin');

      await save(p);

      expect(fieldError(p.harness, 'strength')).toContain('Strength is required');
      expect(p.service.createItem).not.toHaveBeenCalled();
    });

    it('R3.4: the supply "Nhiệt kế điện tử" saves without strength', async () => {
      const p = await openPage(NEW_URL);
      await choosePerson(p, 'Mẹ');
      await setKind(p, 'SUPPLY');
      await typeInto(p.harness, 'name', 'Nhiệt kế điện tử');

      await save(p);

      expect(lastCreatePayload(p)).toMatchObject({ kind: 'SUPPLY', name: 'Nhiệt kế điện tử' });
      // The API rejects any medicine field on a supply (R2.2), so the form must not send them, not even as null.
      const payload = lastCreatePayload(p) ?? {};
      expect(MEDICINE_ONLY_FIELDS.filter((field) => field in payload)).toEqual([]);
      expect(p.toast.success).toHaveBeenCalledWith('Item saved');
      expect(p.router.url).toBe(LIST_URL);
    });
  });

  describe('R2 Field theo loại and P8 Đổi loại', () => {
    it('R2.3: the kind of an existing medicine cannot be changed', async () => {
      const p = await openPage(EDIT_URL, (s) => s.getItem.mockReturnValue(of(item({ dose: '2 viên' }))));

      expect(formOf(p.harness).get('kind')?.enabled ?? false).toBe(false);
    });

    it('P8: Thuốc, then Vật tư, then Thuốc again leaves the medicine fields empty', async () => {
      const p = await openPage(NEW_URL);
      await typeInto(p.harness, 'strength', '10mg');
      await typeInto(p.harness, 'dose', '1 viên');

      await setKind(p, 'SUPPLY');
      await setKind(p, 'MEDICINE');

      const value = formOf(p.harness).value;
      expect(value.strength ?? '').toBe('');
      expect(value.dose ?? '').toBe('');
    });

    it('P8: saving a supply after switching from Thuốc sends no medicine field', async () => {
      const p = await openPage(NEW_URL);
      await choosePerson(p, 'Mẹ');
      await typeInto(p.harness, 'strength', '10mg');
      await typeInto(p.harness, 'dose', '1 viên');
      await setKind(p, 'SUPPLY');
      await typeInto(p.harness, 'name', 'Băng gạc');

      await save(p);

      const payload = lastCreatePayload(p) ?? {};
      for (const field of MEDICINE_ONLY_FIELDS) expect(payload).not.toHaveProperty(field);
    });
  });

  describe('BVA: "Maximum {max} characters" under each limited input', () => {
    it.each([
      ['name', 201, 'Maximum 200 characters'],
      ['strength', 51, 'Maximum 50 characters'],
      ['dose', 101, 'Maximum 100 characters'],
      ['purpose', 501, 'Maximum 500 characters'],
      ['note', 2001, 'Maximum 2000 characters'],
    ])('%s with %i characters shows the limit and sends nothing', async (control, length, message) => {
      const p = await openPage(NEW_URL);
      await fillAtorvastatin(p);

      await typeInto(p.harness, control, 'a'.repeat(length));
      await save(p);

      expect(fieldError(p.harness, control)).toContain(message);
      expect(p.service.createItem).not.toHaveBeenCalled();
    });
  });

  describe('BVA: active ingredients (AC-19)', () => {
    // The ingredient input may hold a FormArray or a FormControl<string[]>; both are filled the same way here.
    const setIngredients = async (p: Page, values: string[]) => {
      const control = formOf(p.harness).get('activeIngredients');
      if (control instanceof FormArray) {
        control.clear();
        values.forEach((v) => control.push(new FormControl(v)));
      } else {
        control?.setValue(values);
      }
      control?.markAsDirty();
      await settle(p.harness, 0);
    };

    it.each([
      ['one ingredient of 101 characters', ['a'.repeat(101)], 'Maximum 100 characters'],
      ['11 ingredients', Array.from({ length: 11 }, (_, i) => `Hoạt chất ${i + 1}`), 'Maximum 10 active ingredients'],
    ])('%s shows its limit message and sends nothing', async (_label, values, message) => {
      const p = await openPage(NEW_URL);
      await fillAtorvastatin(p);

      await setIngredients(p, values);
      await save(p);

      expect(pageText(p.harness)).toContain(message);
      expect(p.service.createItem).not.toHaveBeenCalled();
    });
  });

  describe('R11 Quản lý người in the Person input', () => {
    it('R11.12: the Person input lists "Bố", "Mẹ", "Owner", then "+ Add new person"', async () => {
      const p = await openPage(NEW_URL);

      expect(await personOptions(p)).toEqual(['Bố', 'Mẹ', 'Owner', '+ Add new person']);
    });

    it('R7.6: with no people left, the Person input only offers "+ Add new person"', async () => {
      const p = await openPage(NEW_URL, (s) => s.listProfiles.mockReturnValue(of([])));

      expect(await personOptions(p)).toEqual(['+ Add new person']);
    });

    it('R11.4: adding "Bố" from the Person input selects "Bố" and keeps what was typed', async () => {
      const p = await openPage(NEW_URL, (s, d) => {
        d.results.set(HealthProfileNameDialog, { id: BO_ID, name: 'Bố' });
        s.listProfiles.mockReturnValueOnce(of(PEOPLE.filter((x) => x.id !== BO_ID))).mockReturnValue(of(PEOPLE));
      });
      await typeInto(p.harness, 'name', 'Atorvastatin');

      await choosePerson(p, '+ Add new person');

      expect(p.dialog.dataOf(HealthProfileNameDialog)).toEqual({ mode: 'add' });
      expect(formOf(p.harness).value).toMatchObject({ profileId: BO_ID, name: 'Atorvastatin' });
    });

    it('R11.9: "Cancel" in S10 keeps the form and the selected person', async () => {
      const p = await openPage(NEW_URL, (_s, d) => d.results.set(HealthProfileNameDialog, undefined));
      await fillAtorvastatin(p);

      await choosePerson(p, '+ Add new person');

      expect(formOf(p.harness).value).toMatchObject({ profileId: ME_ID, name: 'Atorvastatin', strength: '10mg' });
    });

    it('R11.11: cancelling the form after adding "Bố" creates no item and does not delete "Bố"', async () => {
      const p = await openPage(NEW_URL, (_s, d) => {
        d.results.set(HealthProfileNameDialog, { id: BO_ID, name: 'Bố' });
        d.results.set(UnsavedChangesDialog, 'discard');
      });
      await typeInto(p.harness, 'name', 'Atorvastatin');
      await choosePerson(p, '+ Add new person');

      await click(p.harness, buttonByText(p.harness, 'Cancel'));

      expect(p.router.url).toBe(LIST_URL);
      expect(p.service.createItem).not.toHaveBeenCalled();
      expect(p.service.deleteProfile).not.toHaveBeenCalled();
    });
  });

  describe('R13 Ghi ở console', () => {
    it('R13.3: a double click on "Save" creates one item, and "Save" is locked while sending', async () => {
      const p = await openPage(NEW_URL, (s) => s.createItem.mockReturnValue(new Subject()));
      await fillAtorvastatin(p);

      await save(p);
      buttonByText(p.harness, 'Save')?.click();

      expect(p.service.createItem).toHaveBeenCalledTimes(1);
      expect(buttonByText(p.harness, 'Save')?.hasAttribute('disabled')).toBe(true);
    });

    it('R13.4: the edit link of a deleted item shows "This item no longer exists"; "Back to list" opens S1', async () => {
      const p = await openPage(EDIT_URL, (s) =>
        s.getItem.mockReturnValue(throwError(() => httpError(404, { errorCode: 'MEDICAL_ITEM_NOT_FOUND' })))
      );

      expect(pageText(p.harness)).toContain('This item no longer exists');

      await click(p.harness, buttonByText(p.harness, 'Back to list'));

      expect(p.router.url).toBe(LIST_URL);
    });

    it('R13.8: when "Bố" was deleted in another tab, the Person input shows "This person no longer exists"', async () => {
      const p = await openPage(NEW_URL, (s) =>
        s.createItem.mockReturnValue(
          throwError(() =>
            httpError(400, {
              errorCode: 'MEDICAL_ITEM_INVALID_INPUT',
              data: { profileId: ['This person no longer exists'] },
            })
          )
        )
      );
      await choosePerson(p, 'Bố');
      await typeInto(p.harness, 'name', 'Atorvastatin');
      await typeInto(p.harness, 'strength', '10mg');

      await save(p);
      // The global ConsoleErrorHandler pushes the field errors of a `_INVALID_INPUT` response.
      TestBed.inject(ValidationErrorService).push({ profileId: ['This person no longer exists'] });
      await settle(p.harness, 0);

      expect(fieldError(p.harness, 'profileId')).toContain('This person no longer exists');
      expect(formOf(p.harness).value).toMatchObject({ name: 'Atorvastatin', strength: '10mg' });
    });

    it('P3: a 400 MEDICAL_ITEM_INVALID_INPUT at field "name" shows under the Name input', async () => {
      const p = await openPage(NEW_URL, (s) =>
        s.createItem.mockReturnValue(throwError(() => httpError(400, { errorCode: 'MEDICAL_ITEM_INVALID_INPUT' })))
      );
      await fillAtorvastatin(p);

      await save(p);
      TestBed.inject(ValidationErrorService).push({ name: ['Maximum 200 characters'] });
      await settle(p.harness, 0);

      expect(fieldError(p.harness, 'name')).toContain('Maximum 200 characters');
    });

    it.each([
      ['R13.10: the person "Bố" and the item were deleted in another tab'],
      ['ST-3 row 6: only the item was deleted'],
    ])('%s: "Save" gets 404 and the form shows "This item no longer exists"', async () => {
      const p = await openPage(EDIT_URL, (s) =>
        s.updateItem.mockReturnValue(throwError(() => httpError(404, { errorCode: 'MEDICAL_ITEM_NOT_FOUND' })))
      );
      await typeInto(p.harness, 'dose', '2 viên');

      await save(p);

      expect(pageText(p.harness)).toContain('This item no longer exists');
      expect(buttonByText(p.harness, 'Back to list')).toBeDefined();
    });
  });

  describe('R14 Nhãn Mang đi', () => {
    it('R14.5: turning on "Mang đi" sends packForTravel: true', async () => {
      const p = await openPage(NEW_URL);
      await fillAtorvastatin(p);

      formOf(p.harness).get('packForTravel')?.setValue(true);
      await save(p);

      expect(lastCreatePayload(p)).toMatchObject({ packForTravel: true });
    });
  });

  describe('R16 Quay lại tra cứu', () => {
    it('R16.3: "Save" with a valid returnTo goes back to that S6 URL', async () => {
      const p = await openPage(withReturnTo(EDIT_URL));
      await typeInto(p.harness, 'dose', '2 viên');

      await save(p);

      expect(p.service.updateItem).toHaveBeenCalledWith(AIR_X_ID, expect.objectContaining({ dose: '2 viên' }));
      expect(p.navigateOut).toHaveBeenCalledWith(RETURN_TO);
    });

    it('R16.6: "Save" with returnTo=https://evil.example ignores it and goes back to S1', async () => {
      const p = await openPage(withReturnTo(EDIT_URL, 'https://evil.example'));
      await typeInto(p.harness, 'dose', '2 viên');

      await save(p);

      expect(p.navigateOut).not.toHaveBeenCalled();
      expect(p.router.url).toBe(LIST_URL);
    });

    it('R16.4: "Cancel" without changes goes back to returnTo and opens no dialog', async () => {
      const p = await openPage(withReturnTo(EDIT_URL));

      await click(p.harness, buttonByText(p.harness, 'Cancel'));

      expect(p.navigateOut).toHaveBeenCalledWith(RETURN_TO);
      expect(p.dialog.openedTimes(UnsavedChangesDialog)).toBe(0);
    });

    it('R16.5: "Cancel" after a change opens UnsavedChangesDialog; "discard" goes back to returnTo unsaved', async () => {
      const p = await openPage(withReturnTo(EDIT_URL), (_s, d) => d.results.set(UnsavedChangesDialog, 'discard'));
      await typeInto(p.harness, 'dose', '2 viên');

      await click(p.harness, buttonByText(p.harness, 'Cancel'));

      expect(p.dialog.openedTimes(UnsavedChangesDialog)).toBe(1);
      expect(p.service.updateItem).not.toHaveBeenCalled();
      expect(p.navigateOut).toHaveBeenCalledWith(RETURN_TO);
    });

    it('R16.5: "stay" keeps S2 with the edited dose', async () => {
      const p = await openPage(withReturnTo(EDIT_URL), (_s, d) => d.results.set(UnsavedChangesDialog, 'stay'));
      await typeInto(p.harness, 'dose', '2 viên');

      await click(p.harness, buttonByText(p.harness, 'Cancel'));

      expect(p.navigateOut).not.toHaveBeenCalled();
      expect(formOf(p.harness).value).toMatchObject({ dose: '2 viên' });
    });

    it('R16.5: "save" saves, then goes back to returnTo', async () => {
      const p = await openPage(withReturnTo(EDIT_URL), (_s, d) => d.results.set(UnsavedChangesDialog, 'save'));
      await typeInto(p.harness, 'dose', '2 viên');

      await click(p.harness, buttonByText(p.harness, 'Cancel'));

      expect(p.service.updateItem).toHaveBeenCalledWith(AIR_X_ID, expect.objectContaining({ dose: '2 viên' }));
      expect(p.navigateOut).toHaveBeenCalledWith(RETURN_TO);
    });

    it('R16.9: for a deleted item with a valid returnTo, "Back to list" goes back to S6', async () => {
      const p = await openPage(withReturnTo(EDIT_URL), (s) =>
        s.getItem.mockReturnValue(throwError(() => httpError(404, { errorCode: 'MEDICAL_ITEM_NOT_FOUND' })))
      );

      await click(p.harness, buttonByText(p.harness, 'Back to list'));

      expect(p.navigateOut).toHaveBeenCalledWith(RETURN_TO);
    });
  });
});
