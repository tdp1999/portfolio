import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'ui-sidebar-group',
  standalone: true,
  template: `
    @if (label()) {
      <button
        type="button"
        class="flex w-full items-center px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted rounded-md select-none bg-transparent border-none"
        [class.cursor-pointer]="collapsible()"
        [class]="collapsible() ? 'hover:text-text-secondary' : ''"
        [disabled]="!collapsible()"
        (click)="toggleCollapsed()"
      >
        {{ label() }}
      </button>
    }
    @if (!collapsed()) {
      <div class="w-full">
        <ng-content />
      </div>
    }
  `,
  host: { class: 'block relative w-full min-w-0' },
})
export class SidebarGroupComponent {
  readonly label = input<string>('');
  readonly collapsible = input(false);

  protected readonly collapsed = signal(false);

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }
}
