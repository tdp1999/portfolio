import { HttpErrorResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { FormGroupDirective } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ToastService } from '@portfolio/console/shared/ui';
import { isObservable, Observable, of } from 'rxjs';
import type { HealthProfileDto, MedicalItemDto } from '@portfolio/shared/types';
import { MedicineCabinetService } from './medicine-cabinet.service';
import { medicineCabinetRoutes } from './medicine-cabinet.routes';
import { EXTERNAL_NAVIGATE, LANDING_URL } from './medicine-cabinet.tokens';

// Shared test harness of the console medicine cabinet pages. Pages run on their real routes, mounted at
// `/medicine-cabinet` like `app.routes.ts`. Services, toasts and dialogs are fakes.
//
// DOM contract for row 5.1c:
// - S1 row: `data-testid="item-row"`, with `item-primary`, `item-secondary`, `item-person`, `item-type`,
//   `item-travel`, `item-updated`, the link `item-link` and the button `item-delete`.
// - S1 person filter: a `mat-select` with `data-testid="person-filter"`.
// - S4 row: `data-testid="person-row"`, with `person-name`, `person-rename` and `person-delete`.
// - S2 inputs carry `formControlName` (`profileId`, `kind`, `name`, `strength`, `dose`, `purpose`, `note`,
//   `packForTravel`); the Person select also has `data-testid="person-select"`.
// - Other actions are found by their visible text ("Save", "Cancel", "Add", "Back to list", ...). An action
//   that only navigates may be an `<a routerLink>` instead of a `<button>`; both match.
// - Page components inject `MatDialog` but must not import `MatDialogModule`, whose provider would replace
//   the fake below.

export const LANDING = 'https://landing.test';
export const OWNER_ID = '01a10b5b-9d90-753e-a6a3-0000000000a3';
export const ME_ID = '01a10b5b-9d90-753e-a6a3-0000000000a1';
export const BO_ID = '01a10b5b-9d90-753e-a6a3-0000000000a2';
export const AIR_X_ID = '01a10b5b-9d90-753e-a6a3-0000000000b1';

const AT = '2026-10-01T00:00:00.000Z';

export const person = (id: string, name: string, itemCount = 0): HealthProfileDto => ({
  id,
  name,
  itemCount,
  createdAt: AT,
  updatedAt: AT,
});

/** Already sorted A→Z, as the API returns them (R11.12). */
export const PEOPLE = [person(BO_ID, 'Bố'), person(ME_ID, 'Mẹ', 3), person(OWNER_ID, 'Owner', 5)];

export const item = (overrides: Partial<MedicalItemDto> = {}): MedicalItemDto => ({
  id: AIR_X_ID,
  profileId: OWNER_ID,
  kind: 'MEDICINE',
  name: 'Air-X',
  activeIngredients: ['Simethicone'],
  strength: '80mg',
  dose: null,
  timing: null,
  usageType: null,
  purpose: null,
  note: null,
  packForTravel: true,
  createdAt: AT,
  updatedAt: AT,
  ...overrides,
});

export const page = (data: MedicalItemDto[], total = data.length) => ({ data, total, page: 1, limit: 20 });

export const httpError = (status: number, body: Record<string, unknown> = {}) =>
  new HttpErrorResponse({ status, error: { statusCode: status, ...body } });

/** Arguments of a service method, so a mock records calls with the real argument types. */
type Args<K extends keyof MedicineCabinetService> = MedicineCabinetService[K] extends (...args: infer A) => unknown
  ? A
  : never;

export function createService() {
  return {
    listItems: jest.fn((..._args: Args<'listItems'>) => of(page([item()]))),
    getItem: jest.fn((..._args: Args<'getItem'>) => of(item())),
    createItem: jest.fn((..._args: Args<'createItem'>) => of({ id: 'new-id' })),
    updateItem: jest.fn((..._args: Args<'updateItem'>) => of({ success: true })),
    deleteItem: jest.fn((..._args: Args<'deleteItem'>) => of({ success: true })),
    listProfiles: jest.fn(() => of(PEOPLE)),
    createProfile: jest.fn((..._args: Args<'createProfile'>) => of({ id: BO_ID })),
    renameProfile: jest.fn((..._args: Args<'renameProfile'>) => of({ success: true })),
    deleteProfile: jest.fn((..._args: Args<'deleteProfile'>) => of({ success: true })),
  };
}
export type ServiceMock = ReturnType<typeof createService>;

/** `MatDialog` fake: each dialog component class gets a result, a function of the dialog data, or an Observable. */
export class DialogFake {
  readonly results = new Map<unknown, unknown>();
  readonly open = jest.fn((component: unknown, config?: { data?: unknown }) => {
    const stored = this.results.get(component);
    const value = typeof stored === 'function' ? stored(config?.data) : stored;
    const closed: Observable<unknown> = isObservable(value) ? value : of(value);
    return { afterClosed: () => closed, close: jest.fn(), componentInstance: {} };
  });
  readonly closeAll = jest.fn();
  readonly openDialogs = [];

  dataOf(component: unknown): unknown {
    return this.open.mock.calls.find(([c]) => c === component)?.[1]?.data;
  }

  openedTimes(component: unknown): number {
    return this.open.mock.calls.filter(([c]) => c === component).length;
  }
}

export interface Page {
  harness: RouterTestingHarness;
  service: ServiceMock;
  toast: { success: jest.Mock; error: jest.Mock; warning: jest.Mock; info: jest.Mock };
  dialog: DialogFake;
  navigateOut: jest.Mock;
  router: Router;
}

/** Opens a console URL such as `/medicine-cabinet?person=…` and waits for the first load. */
export async function openPage(
  url: string,
  setup: (service: ServiceMock, dialog: DialogFake) => void = () => undefined
): Promise<Page> {
  const service = createService();
  const dialog = new DialogFake();
  const toast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
  const navigateOut = jest.fn();
  setup(service, dialog);

  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'medicine-cabinet', children: medicineCabinetRoutes }]),
      provideNoopAnimations(),
      { provide: MedicineCabinetService, useValue: service },
      { provide: ToastService, useValue: toast },
      { provide: MatDialog, useValue: dialog },
      { provide: LANDING_URL, useValue: LANDING },
      { provide: EXTERNAL_NAVIGATE, useValue: navigateOut },
    ],
  });
  const harness = await RouterTestingHarness.create(url);
  await settle(harness);
  return { harness, service, toast, dialog, navigateOut, router: TestBed.inject(Router) };
}

/** Waits past the 300 ms skeleton floor of `withListLoading`, then renders. */
export async function settle(harness: RouterTestingHarness, ms = 350): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  harness.fixture.detectChanges();
  await harness.fixture.whenStable();
  harness.fixture.detectChanges();
}

const root = (harness: RouterTestingHarness): HTMLElement => harness.fixture.nativeElement as HTMLElement;

export const byTestId = (harness: RouterTestingHarness, id: string, scope?: Element): HTMLElement | null =>
  (scope ?? root(harness)).querySelector<HTMLElement>(`[data-testid="${id}"]`);

export const allByTestId = (harness: RouterTestingHarness, id: string, scope?: Element): HTMLElement[] =>
  Array.from((scope ?? root(harness)).querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

export const textOf = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

export const pageText = (harness: RouterTestingHarness): string => textOf(root(harness));

/**
 * A button, or a link styled as one, whose visible text is exactly `label`, searched in the page and in the
 * CDK overlay. Links match because an action that only navigates should be an `<a routerLink>`.
 */
export const buttonByText = (harness: RouterTestingHarness, label: string): HTMLElement | undefined =>
  [
    ...Array.from(root(harness).querySelectorAll<HTMLElement>('button, a')),
    ...Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-container button, .cdk-overlay-container a')),
  ].find((el) => textOf(el) === label);

export async function click(harness: RouterTestingHarness, el: HTMLElement | null | undefined, ms?: number) {
  if (!el) throw new Error('element to click was not found');
  el.click();
  await settle(harness, ms);
}

/** The reactive form of the routed page (`FormGroupDirective` on its `<form>`). */
export const formOf = (harness: RouterTestingHarness) => {
  const debug: DebugElement | null = harness.fixture.debugElement.query(By.directive(FormGroupDirective));
  if (!debug) throw new Error('the page has no reactive form');
  return debug.injector.get(FormGroupDirective).form;
};

/** Types into the input or textarea bound to `formControlName`. */
export async function typeInto(harness: RouterTestingHarness, control: string, value: string) {
  const input = root(harness).querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `input[formControlName="${control}"], textarea[formControlName="${control}"]`
  );
  if (!input) throw new Error(`no input for ${control}`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
  await settle(harness, 0);
}

/** Text of the `mat-error` in the form field that holds `formControlName`. */
export const fieldError = (harness: RouterTestingHarness, control: string): string => {
  const host = root(harness).querySelector(`[formControlName="${control}"]`);
  return textOf(host?.closest('mat-form-field')?.querySelector('mat-error'));
};
