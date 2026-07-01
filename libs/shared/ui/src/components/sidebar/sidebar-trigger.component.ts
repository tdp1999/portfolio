import { Component, inject } from '@angular/core';

import { SidebarState } from './sidebar-state.service';

@Component({
  selector: 'ui-sidebar-trigger',
  standalone: true,
  template: `
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md p-2 text-text-secondary hover:bg-surface-elevated hover:text-text transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      (click)="state.toggle()"
      aria-label="Toggle sidebar"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    </button>
  `,
})
export class SidebarTriggerComponent {
  protected readonly state = inject(SidebarState);
}
