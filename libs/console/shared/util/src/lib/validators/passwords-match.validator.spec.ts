import { FormControl, FormGroup, Validators } from '@angular/forms';
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

  // The mirror is what makes the message visible: `<mat-form-field>` only renders its
  // `<mat-error>` when the *control* is in an error state, so a group-only error is silent.
  describe('mirroring onto the confirm control', () => {
    const build = () =>
      new FormGroup(
        {
          password: new FormControl('abc123', Validators.required),
          confirmPassword: new FormControl('abc123', Validators.required),
        },
        { validators: [passwordsMatchValidator()] }
      );

    it('should mark the confirm control invalid when passwords differ', () => {
      const group = build();
      group.controls.confirmPassword.setValue('xyz789');

      expect(group.controls.confirmPassword.errors).toEqual({ passwordsMismatch: true });
      expect(group.controls.confirmPassword.invalid).toBe(true);
    });

    it('should leave the password control alone', () => {
      const group = build();
      group.controls.confirmPassword.setValue('xyz789');

      expect(group.controls.password.errors).toBeNull();
    });

    it('should clear the mirrored error once the passwords match again', () => {
      const group = build();
      group.controls.confirmPassword.setValue('xyz789');
      group.controls.confirmPassword.setValue('abc123');

      expect(group.controls.confirmPassword.errors).toBeNull();
      expect(group.errors).toBeNull();
    });

    it('should keep the confirm control own errors intact', () => {
      const group = build();
      group.controls.confirmPassword.setValue('');

      expect(group.controls.confirmPassword.errors).toEqual({ required: true, passwordsMismatch: true });
    });

    it('should not strip own errors when clearing the mismatch', () => {
      const group = new FormGroup(
        {
          password: new FormControl('', Validators.required),
          confirmPassword: new FormControl('', Validators.required),
        },
        { validators: [passwordsMatchValidator()] }
      );

      // Both empty → they match, so only `required` should remain.
      expect(group.controls.confirmPassword.errors).toEqual({ required: true });
    });
  });
});
