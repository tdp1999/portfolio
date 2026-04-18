import { FormControl, FormGroup } from '@angular/forms';
import { passwordsMatchValidator } from './passwords-match.validator';

describe('passwordsMatchValidator', () => {
  it('should return null when passwords match', () => {
    const group = new FormGroup(
      {
        password: new FormControl('abc123'),
        confirmPassword: new FormControl('abc123'),
      },
      { validators: [passwordsMatchValidator()] }
    );

    expect(group.errors).toBeNull();
  });

  it('should return passwordsMismatch when passwords differ', () => {
    const group = new FormGroup(
      {
        password: new FormControl('abc123'),
        confirmPassword: new FormControl('xyz789'),
      },
      { validators: [passwordsMatchValidator()] }
    );

    expect(group.errors).toEqual({ passwordsMismatch: true });
  });

  it('should support custom field keys', () => {
    const group = new FormGroup(
      {
        newPassword: new FormControl('abc'),
        newPasswordConfirm: new FormControl('xyz'),
      },
      { validators: [passwordsMatchValidator('newPassword', 'newPasswordConfirm')] }
    );

    expect(group.errors).toEqual({ passwordsMismatch: true });
  });

  it('should return null when one field is missing', () => {
    const group = new FormGroup(
      {
        password: new FormControl('abc'),
      },
      { validators: [passwordsMatchValidator()] }
    );

    expect(group.errors).toBeNull();
  });
});
