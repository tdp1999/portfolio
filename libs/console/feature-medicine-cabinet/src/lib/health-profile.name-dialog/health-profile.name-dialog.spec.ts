import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ERROR_DICTIONARY } from '@portfolio/console/shared/util';
import { ToastService } from '@portfolio/console/shared/ui';
import { HealthProfileErrorCode } from '@portfolio/shared/errors';
import { Subject, throwError } from 'rxjs';
import { MedicineCabinetService } from '../medicine-cabinet.service';
import { BO_ID, createService, httpError, ME_ID, textOf } from '../medicine-cabinet-testing.util';
import HealthProfileNameDialog, { HealthProfileNameDialogData } from './health-profile.name-dialog';

// 'S10 Hộp tên người'. Expected values come from R11, R13.3, R13.12, 'P3 Lỗi API' and the BVA table (person
// name 1–50) of the medicine cabinet epic. The dialog shows the 409 on the name field itself.

const NAME_TAKEN = httpError(409, { errorCode: HealthProfileErrorCode.NAME_TAKEN });

function open(
  data: HealthProfileNameDialogData,
  setup: (s: ReturnType<typeof createService>) => void = () => undefined
) {
  const service = createService();
  const toast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
  const dialogRef = { close: jest.fn() };
  setup(service);
  TestBed.configureTestingModule({
    imports: [HealthProfileNameDialog],
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MedicineCabinetService, useValue: service },
      { provide: ToastService, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(HealthProfileNameDialog);
  fixture.detectChanges();
  return { fixture, service, toast, dialogRef };
}

const el = (fixture: ComponentFixture<unknown>): HTMLElement => fixture.nativeElement;
const nameInput = (fixture: ComponentFixture<unknown>) =>
  el(fixture).querySelector<HTMLInputElement>('input[formControlName="name"]');
const nameError = (fixture: ComponentFixture<unknown>) =>
  textOf(nameInput(fixture)?.closest('mat-form-field')?.querySelector('mat-error'));
const button = (fixture: ComponentFixture<unknown>, label: string) =>
  Array.from(el(fixture).querySelectorAll('button')).find((b) => textOf(b) === label);

async function typeName(fixture: ComponentFixture<unknown>, value: string) {
  const input = nameInput(fixture);
  if (!input) throw new Error('no name input');
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  await fixture.whenStable();
}

async function press(fixture: ComponentFixture<unknown>, label: string) {
  const target = button(fixture, label);
  if (!target) throw new Error(`no button "${label}"`);
  target.click();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('HealthProfileNameDialog (S10)', () => {
  describe('add mode', () => {
    it('R11.1: "Add" saves "Bố", closes with the new person and shows "Person saved"', async () => {
      const { fixture, service, toast, dialogRef } = open({ mode: 'add' });

      await typeName(fixture, 'Bố');
      await press(fixture, 'Add');

      expect(service.createProfile).toHaveBeenCalledWith({ name: 'Bố' });
      expect(dialogRef.close).toHaveBeenCalledWith({ id: BO_ID, name: 'Bố' });
      expect(toast.success).toHaveBeenCalledWith('Person saved');
    });

    it('R11.2: "mẹ" next to "Mẹ" shows "A person with this name already exists"; S10 stays open with "mẹ"', async () => {
      const { fixture, dialogRef } = open({ mode: 'add' }, (s) =>
        s.createProfile.mockReturnValue(throwError(() => NAME_TAKEN))
      );

      await typeName(fixture, 'mẹ');
      await press(fixture, 'Add');

      expect(nameError(fixture)).toContain('A person with this name already exists');
      expect(nameInput(fixture)?.value).toBe('mẹ');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('R13.3: "Add" is locked while sending, so a double click creates one person', async () => {
      const { fixture, service } = open({ mode: 'add' }, (s) => s.createProfile.mockReturnValue(new Subject()));

      await typeName(fixture, 'Bố');
      await press(fixture, 'Add');
      button(fixture, 'Add')?.click();

      expect(service.createProfile).toHaveBeenCalledTimes(1);
      expect(button(fixture, 'Add')?.disabled).toBe(true);
    });

    it.each([
      ['0 characters: "Name is required"', '', 'Name is required'],
      ['51 characters: "Maximum 50 characters"', 'a'.repeat(51), 'Maximum 50 characters'],
    ])('BVA: a name of %s; nothing is sent and S10 stays open', async (_label, value, message) => {
      const { fixture, service, dialogRef } = open({ mode: 'add' });

      await typeName(fixture, value);
      await press(fixture, 'Add');

      expect(nameError(fixture)).toContain(message);
      expect(nameInput(fixture)?.value).toBe(value);
      expect(service.createProfile).not.toHaveBeenCalled();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('BVA: a name of 50 characters is saved', async () => {
      const { fixture, service } = open({ mode: 'add' });

      await typeName(fixture, 'a'.repeat(50));
      await press(fixture, 'Add');

      expect(service.createProfile).toHaveBeenCalledWith({ name: 'a'.repeat(50) });
    });
  });

  describe('rename mode', () => {
    it('R11.3: shows "Rename person" with "Mẹ" filled in; saving "Má" shows "Person saved"', async () => {
      const { fixture, service, toast, dialogRef } = open({ mode: 'rename', id: ME_ID, name: 'Mẹ' });

      expect(textOf(el(fixture))).toContain('Rename person');
      expect(nameInput(fixture)?.value).toBe('Mẹ');

      await typeName(fixture, 'Má');
      await press(fixture, 'Save');

      expect(service.renameProfile).toHaveBeenCalledWith(ME_ID, { name: 'Má' });
      expect(toast.success).toHaveBeenCalledWith('Person saved');
      expect(dialogRef.close).toHaveBeenCalledWith({ id: ME_ID, name: 'Má' });
    });

    it('R11.6: renaming "Bố" to "mẹ" gets 409: the error shows on the name field and S10 stays open with "mẹ"', async () => {
      const { fixture, dialogRef } = open({ mode: 'rename', id: BO_ID, name: 'Bố' }, (s) =>
        s.renameProfile.mockReturnValue(throwError(() => NAME_TAKEN))
      );

      await typeName(fixture, 'mẹ');
      await press(fixture, 'Save');

      expect(nameError(fixture)).toContain('A person with this name already exists');
      expect(nameInput(fixture)?.value).toBe('mẹ');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('R13.3: "Save" is locked while sending', async () => {
      const { fixture, service } = open({ mode: 'rename', id: ME_ID, name: 'Mẹ' }, (s) =>
        s.renameProfile.mockReturnValue(new Subject())
      );

      await typeName(fixture, 'Má');
      await press(fixture, 'Save');
      button(fixture, 'Save')?.click();

      expect(service.renameProfile).toHaveBeenCalledTimes(1);
      expect(button(fixture, 'Save')?.disabled).toBe(true);
    });

    it('R13.12: a 404 because "Bố" was deleted in another tab closes S10 and shows "This person no longer exists"', async () => {
      const { fixture, toast, dialogRef } = open({ mode: 'rename', id: BO_ID, name: 'Bố' }, (s) =>
        s.renameProfile.mockReturnValue(
          throwError(() => httpError(404, { errorCode: HealthProfileErrorCode.NOT_FOUND }))
        )
      );

      await typeName(fixture, 'Ba');
      await press(fixture, 'Save');

      expect(dialogRef.close).toHaveBeenCalledWith('missing');
      const shown = [toast.error, toast.warning, toast.info].flatMap((fn) => fn.mock.calls.map(([message]) => message));
      expect(shown).toContain('This person no longer exists');
    });
  });

  it('P3: the console error dictionary has HEALTH_PROFILE_NAME_TAKEN', () => {
    expect(Object.keys(ERROR_DICTIONARY)).toContain(HealthProfileErrorCode.NAME_TAKEN);
  });

  it('R11.9, R11.10: "Cancel" closes S10 without a service call', async () => {
    const { fixture, service, dialogRef } = open({ mode: 'add' });

    await press(fixture, 'Cancel');

    expect(service.createProfile).not.toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
