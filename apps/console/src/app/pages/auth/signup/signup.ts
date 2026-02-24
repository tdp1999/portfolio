import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'console-signup',
  standalone: true,
  template: `
    <h2 class="text-xl font-semibold text-text">Create account</h2>
    <p class="mt-2 text-sm text-text-secondary">Sign up for a new account.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignupComponent {}
