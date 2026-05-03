import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

export interface SegmentOption {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type LandingSegmentedVariant = 'apple' | 'hairline' | 'underline';

@Component({
  selector: 'landing-segmented',
  standalone: true,
  template: `
    <div [class]="rootClasses()" role="tablist" [attr.aria-label]="ariaLabel() || null">
      @for (seg of segments(); track seg.id) {
        <button
          type="button"
          role="tab"
          [class]="segmentClass(seg)"
          [attr.id]="tabId(seg.id)"
          [attr.aria-selected]="seg.id === active()"
          [attr.aria-controls]="panelId(seg.id)"
          [attr.tabindex]="seg.id === active() ? 0 : -1"
          [disabled]="seg.disabled === true"
          (click)="select(seg)"
          (keydown)="onKey($event)"
        >
          {{ seg.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './segmented.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedComponent {
  readonly segments = input.required<readonly SegmentOption[]>();
  readonly active = model<string>('');
  readonly variant = input<LandingSegmentedVariant>('apple');
  readonly ariaLabel = input<string>('');
  readonly idPrefix = input<string>('seg');

  protected readonly rootClasses = computed(() => `landing-segmented landing-segmented--${this.variant()}`);

  protected segmentClass(seg: SegmentOption): string {
    return `landing-segmented__btn${seg.id === this.active() ? ' is-active' : ''}`;
  }

  protected tabId(id: string): string {
    return `${this.idPrefix()}-tab-${id}`;
  }

  protected panelId(id: string): string {
    return `${this.idPrefix()}-panel-${id}`;
  }

  protected select(seg: SegmentOption): void {
    const current = this.segments().find((s) => s.id === seg.id);
    if (current?.disabled) return;
    this.active.set(seg.id);
  }

  protected onKey(event: KeyboardEvent): void {
    const enabled = this.segments().filter((s) => !s.disabled);
    if (enabled.length === 0) return;
    const currentIdx = Math.max(
      0,
      enabled.findIndex((s) => s.id === this.active())
    );

    let nextIdx = currentIdx;
    switch (event.key) {
      case 'ArrowRight':
        nextIdx = (currentIdx + 1) % enabled.length;
        break;
      case 'ArrowLeft':
        nextIdx = (currentIdx - 1 + enabled.length) % enabled.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = enabled.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.active.set(enabled[nextIdx].id);
    const tablist = (event.currentTarget as HTMLElement).parentElement;
    const next = tablist?.querySelector<HTMLButtonElement>(`#${this.tabId(enabled[nextIdx].id)}`);
    next?.focus();
  }
}
