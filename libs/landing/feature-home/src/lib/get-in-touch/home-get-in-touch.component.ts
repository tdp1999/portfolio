import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  ButtonComponent,
  ContainerComponent,
  EyebrowComponent,
  LandingHeadingComponent,
  LandingLinkComponent,
} from '@portfolio/landing/shared/ui';
import { SOCIAL_PLATFORM_LABELS } from '@portfolio/shared/enum-labels';
import { type SocialLink } from '@portfolio/shared/types';

type Channel = { readonly label: string; readonly url: string };

@Component({
  selector: 'landing-home-get-in-touch',
  standalone: true,
  imports: [ButtonComponent, ContainerComponent, EyebrowComponent, LandingHeadingComponent, LandingLinkComponent],
  templateUrl: './home-get-in-touch.component.html',
  styleUrl: './home-get-in-touch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeGetInTouchComponent {
  readonly email = input<string>('');
  readonly contactCopy = input<string>('');
  readonly socialLinks = input<readonly SocialLink[]>([]);
  /** Pre-localized resume entry — parent picks `resumeUrls.en` / `.vi`. */
  readonly resumeUrl = input<string>('');
  readonly resumeName = input<string>('CV PDF');

  private readonly document = inject(DOCUMENT);

  protected readonly channels = computed<readonly Channel[]>(() => {
    const list: Channel[] = this.socialLinks().map((s) => ({
      label: SOCIAL_PLATFORM_LABELS[s.platform] ?? s.platform,
      url: s.url,
    }));
    const resume = this.resumeUrl();
    if (resume) list.push({ label: this.resumeName(), url: resume });
    return list;
  });

  protected readonly mailto = computed(() => (this.email() ? `mailto:${this.email()}` : ''));

  protected sendMail(): void {
    const target = this.mailto();
    if (target) this.document.defaultView?.location.assign(target);
  }
}
