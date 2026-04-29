import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';

const ERROR_CONFIG: Record<string, { title: string; description: string }> = {
  '403': { title: 'Access Denied', description: 'You do not have permission to view this page.' },
  '404': { title: 'Not Found', description: 'The page you are looking for does not exist.' },
  '500': {
    title: 'Server Error',
    description: 'Something went wrong on our end. Please try again later.',
  },
};

const DEFAULT_ERROR = { title: 'Error', description: 'An unexpected error occurred.' };

@Component({
  selector: 'console-error-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-dvh flex-col items-center justify-center text-center">
      <h1 class="text-6xl font-bold text-text-muted">{{ code() }}</h1>
      <h2 class="mt-4 text-2xl font-semibold text-text">{{ config().title }}</h2>
      <p class="mt-2 text-text-secondary">{{ config().description }}</p>
      <div class="mt-8 flex items-center gap-4">
        <a routerLink="/" class="text-primary hover:underline">Go to Dashboard</a>
        <button (click)="refresh()" class="text-text-secondary hover:text-text hover:underline">Refresh</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ErrorPageComponent {
  private readonly document = inject(DOCUMENT);

  code = input.required<string>();
  config = computed(() => ERROR_CONFIG[this.code()] ?? DEFAULT_ERROR);

  refresh(): void {
    this.document.location.reload();
  }
}
