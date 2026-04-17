import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function maxDecimalsValidator(maxDecimals: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    const decimals = String(value).split('.')[1]?.length ?? 0;
    if (decimals > maxDecimals) {
      return { maxDecimals: { max: maxDecimals, actual: decimals } };
    }
    return null;
  };
}
