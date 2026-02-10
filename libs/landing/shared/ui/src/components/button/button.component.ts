import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'landing-button',
  standalone: true,
  imports: [],
  template: `
    <button [class]="buttonClasses()" [disabled]="disabled()" (click)="handleClick($event)">
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  size = input<'sm' | 'md' | 'lg'>('md');
  disabled = input<boolean>(false);

  buttonClick = output<MouseEvent>();

  protected buttonClasses = computed(() => {
    const v = this.variant();
    const s = this.size();
    return `btn btn--${v} btn--${s}`;
  });

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.buttonClick.emit(event);
    }
  }
}
