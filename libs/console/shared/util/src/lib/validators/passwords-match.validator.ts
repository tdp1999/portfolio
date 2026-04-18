import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordsMatchValidator(passwordKey = 'password', confirmKey = 'confirmPassword'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey);
    const confirm = group.get(confirmKey);
    if (password && confirm && password.value !== confirm.value) {
      return { passwordsMismatch: true };
    }
    return null;
  };
}
