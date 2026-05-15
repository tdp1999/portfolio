import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'landing-colophon-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl px-6 py-16">
      <h1 class="font-display text-display-lg text-landing-text-300">Colophon</h1>
      <p class="mt-4 font-sans text-body-md text-landing-text-500">
        Stack, type, and credits. Content lands in task 298.
      </p>
    </div>
  `,
})
export class ColophonPage {}
