import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'landing-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-3xl px-6 py-24 text-center">
      <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500">404</p>
      <h1 class="mt-3 font-display text-display-lg text-landing-text-300">Page not found</h1>
      <p class="mt-4 font-sans text-body-md text-landing-text-500">That URL does not match anything on this site.</p>
      <a
        routerLink="/"
        class="mt-8 inline-block font-sans text-body-md text-landing-accent transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent-hover"
      >
        ← Back to home
      </a>
    </div>
  `,
})
export class NotFoundPage {}
