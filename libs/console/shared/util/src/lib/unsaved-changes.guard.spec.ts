import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import {
  unsavedChangesGuard,
  onBeforeUnload,
  type HasUnsavedChanges,
  type UnsavedChangesResult,
} from './unsaved-changes.guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockComponent(
  dirty: boolean | ReturnType<typeof signal<boolean>>,
  saveHandler?: () => Promise<boolean>
): HasUnsavedChanges {
  return {
    hasUnsavedChanges: () => dirty,
    ...(saveHandler ? { onSaveAndContinue: saveHandler } : {}),
  };
}

function mockDialogResult(result: UnsavedChangesResult | undefined) {
  return { afterClosed: () => of(result) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('unsavedChangesGuard', () => {
  let dialog: jest.Mocked<MatDialog>;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        provideRouter([]),
        {
          provide: MatDialog,
          useValue: { open: jest.fn() },
        },
      ],
    });

    dialog = TestBed.inject(MatDialog) as jest.Mocked<MatDialog>;
    router = TestBed.inject(Router);
  });

  function runGuard(component: HasUnsavedChanges): Promise<boolean> {
    return TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component,
        {} as any, // ActivatedRouteSnapshot
        {} as any, // RouterStateSnapshot (current)
        {} as any // RouterStateSnapshot (next)
      )
    ) as Promise<boolean>;
  }

  it('should allow navigation when component is clean (boolean)', async () => {
    const component = createMockComponent(false);
    const result = await runGuard(component);
    expect(result).toBe(true);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should allow navigation when component is clean (signal)', async () => {
    const component = createMockComponent(signal(false));
    const result = await runGuard(component);
    expect(result).toBe(true);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should block navigation when dirty and user clicks Stay', async () => {
    dialog.open.mockReturnValue(mockDialogResult('stay') as any);
    const component = createMockComponent(true);
    const result = await runGuard(component);
    expect(result).toBe(false);
  });

  it('should allow navigation when dirty and user clicks Discard', async () => {
    dialog.open.mockReturnValue(mockDialogResult('discard') as any);
    const component = createMockComponent(true);
    const result = await runGuard(component);
    expect(result).toBe(true);
  });

  it('should call onSaveAndContinue when dirty and user clicks Save', async () => {
    dialog.open.mockReturnValue(mockDialogResult('save') as any);
    const saveHandler = jest.fn().mockResolvedValue(true);
    const component = createMockComponent(true, saveHandler);
    const result = await runGuard(component);
    expect(saveHandler).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should block navigation if save handler returns false', async () => {
    dialog.open.mockReturnValue(mockDialogResult('save') as any);
    const saveHandler = jest.fn().mockResolvedValue(false);
    const component = createMockComponent(true, saveHandler);
    const result = await runGuard(component);
    expect(saveHandler).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('should not show Save button when onSaveAndContinue is absent', async () => {
    dialog.open.mockReturnValue(mockDialogResult('discard') as any);
    const component = createMockComponent(true);
    await runGuard(component);
    expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { showSave: false } }));
  });

  it('should show Save button when onSaveAndContinue is provided', async () => {
    dialog.open.mockReturnValue(mockDialogResult('discard') as any);
    const saveHandler = jest.fn().mockResolvedValue(true);
    const component = createMockComponent(true, saveHandler);
    await runGuard(component);
    expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { showSave: true } }));
  });

  it('should block navigation when dialog is dismissed (undefined)', async () => {
    dialog.open.mockReturnValue(mockDialogResult(undefined) as any);
    const component = createMockComponent(true);
    const result = await runGuard(component);
    expect(result).toBe(false);
  });

  it('should detect dirty state from signal', async () => {
    dialog.open.mockReturnValue(mockDialogResult('discard') as any);
    const component = createMockComponent(signal(true));
    const result = await runGuard(component);
    expect(result).toBe(true);
    expect(dialog.open).toHaveBeenCalled();
  });
});

describe('onBeforeUnload', () => {
  it('should call preventDefault when dirty', () => {
    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const preventSpy = jest.spyOn(event, 'preventDefault');
    onBeforeUnload(event, true);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('should not set returnValue when clean', () => {
    const event = new Event('beforeunload') as BeforeUnloadEvent;
    const preventSpy = jest.spyOn(event, 'preventDefault');
    onBeforeUnload(event, false);
    expect(preventSpy).not.toHaveBeenCalled();
  });
});
