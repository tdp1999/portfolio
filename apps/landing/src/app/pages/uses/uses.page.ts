import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'landing-uses-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="font-display text-display-lg text-landing-text-300">Uses</h1>
      <p class="mt-4 font-sans text-body-md text-landing-text-500">
        Tools, hardware, and dotfiles. Content lands in task 297.
      </p>
    </div>
  `,
})
export class UsesPage {}
