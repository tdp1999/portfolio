import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DEFAULT_ERROR, ERROR_CONFIG } from './error.data';

@Component({
  selector: 'console-error',
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
export default class Error {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly document = inject(DOCUMENT);

  // ── Inputs ────────────────────────────────────────────────────────
  code = input.required<string>();

  // ── Derived ───────────────────────────────────────────────────────
  config = computed(() => ERROR_CONFIG[this.code()] ?? DEFAULT_ERROR);

  refresh(): void {
    this.document.location.reload();
  }
}
