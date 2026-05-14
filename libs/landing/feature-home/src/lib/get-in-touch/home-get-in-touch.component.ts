import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  ButtonComponent,
  ContainerComponent,
  EyebrowComponent,
  LandingGlobeComponent,
  LandingHeadingComponent,
} from '@portfolio/landing/shared/ui';
import { type SocialLink } from '@portfolio/shared/types';

@Component({
  selector: 'landing-home-get-in-touch',
  standalone: true,
  imports: [ButtonComponent, ContainerComponent, EyebrowComponent, LandingGlobeComponent, LandingHeadingComponent],
  templateUrl: './home-get-in-touch.component.html',
  styleUrl: './home-get-in-touch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeGetInTouchComponent {
  readonly email = input<string>('');
  readonly contactCopy = input<string>('');
  /** Parent still passes these; the V2 layout drops the channel row, so they
   *  are accepted but unused until the CV placement is decided. */
  readonly socialLinks = input<readonly SocialLink[]>([]);
  readonly resumeUrl = input<string>('');
  readonly resumeName = input<string>('CV PDF');

  private readonly document = inject(DOCUMENT);

  protected readonly mailto = computed(() => (this.email() ? `mailto:${this.email()}` : ''));

  protected sendMail(subject?: string): void {
    const base = this.mailto();
    if (!base) return;
    const url = subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
    this.document.defaultView?.location.assign(url);
  }
}
