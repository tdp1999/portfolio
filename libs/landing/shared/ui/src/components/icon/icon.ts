import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICON_PROVIDER } from './icon-provider.token';

@Component({
  selector: 'landing-icon',
  standalone: true,
  // a11y: icons are decorative by default and hidden from the a11y tree. A
  // meaningful icon opts in by passing [label], which exposes it as an image
  // with an accessible name. Redundant/decorative icons (chevrons, arrows next
  // to visible text, icon-only controls whose host already carries a label)
  // need no change — the default keeps them out of the tree.
  template: `<span
    [innerHTML]="svg()"
    [attr.aria-hidden]="label() ? null : true"
    [attr.role]="label() ? 'img' : null"
    [attr.aria-label]="label() || null"
  ></span>`,
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input(24);
  /** Accessible name. Omit for decorative icons (default: hidden from AT). */
  readonly label = input<string>('');

  private readonly provider = inject(ICON_PROVIDER);
  private readonly sanitizer = inject(DomSanitizer);

  readonly svg = computed(() => {
    const iconName = this.name();

    // Validate icon name to prevent XSS injection attacks
    // Only allow lowercase alphanumeric characters and hyphens
    if (!/^[a-z0-9-]+$/.test(iconName)) {
      console.warn(`[IconComponent] Invalid icon name rejected: "${iconName}"`);
      return '';
    }

    const raw = this.provider.getSvg(iconName, this.size());
    if (!raw) return '';

    // Safe to bypass sanitization: icon data comes from trusted provider
    // and icon name has been validated against injection attacks
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}
