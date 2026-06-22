import { booleanAttribute, Directive, input } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import type { EditorDocument, EditorMode } from './redoc-rte.types';

// Abstract DI contract every concrete editor implements. Carries the shared signal
// inputs and leaves the ControlValueAccessor hooks abstract for the concrete impl.
// Decorated `@Directive()` (no selector) so Angular permits input()/DI in a base
// class — concrete impls are real components that `extends RedocRteEditor`.
@Directive()
export abstract class RedocRteEditor implements ControlValueAccessor {
  readonly mode = input<EditorMode>('semantic');
  readonly placeholder = input<string>('');
  readonly readonly = input(false, { transform: booleanAttribute });

  abstract writeValue(value: EditorDocument | null): void;
  abstract registerOnChange(fn: (value: EditorDocument | null) => void): void;
  abstract registerOnTouched(fn: () => void): void;
  abstract setDisabledState?(isDisabled: boolean): void;
}
