import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICON_PROVIDER } from './icon-provider.token';

@Component({
  selector: 'landing-icon',
  standalone: true,
  template: `<span [innerHTML]="svg()"></span>`,
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input(24);

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
