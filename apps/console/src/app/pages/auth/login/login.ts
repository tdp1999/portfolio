import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'console-login',
  standalone: true,
  template: `
    <h2 class="text-xl font-semibold text-text">Sign in</h2>
    <p class="mt-2 text-sm text-text-secondary">Enter your credentials to continue.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {}
