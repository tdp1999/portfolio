import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import {
  Container,
  Eyebrow,
  Heading,
  Link,
  LandingCopyPipe,
  LandingLocaleService,
  resolveCopy,
  UmamiEventDirective,
} from '@portfolio/landing/shared/ui';
import { getLocalized } from '@portfolio/shared/utils/lite';
import type { CtaItem } from './about.cta.types';

/**
 * About → §04 What's next. Closing CTA section: one prompt line + a row of
 * link CTAs. No form (the form lives on `/contact`) — these are pure
 * navigations per the CLAUDE.md "links for navigation, buttons for actions"
 * guardrail.
 *
 * The Contact link is always present; LinkedIn, GitHub, and Download CV are
 * pulled from `ProfileService` and only rendered when their URL exists.
 *
 * Heading + lede default to a tight locale-aware fallback so a freshly-seeded
 * profile still renders cleanly; the author overrides via Console
 * (`Profile.ctaHeading` / `Profile.ctaLede`).
 */
@Component({
  selector: 'landing-about-cta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Heading, Link, UmamiEventDirective, LandingCopyPipe],
  templateUrl: './about.cta.html',
  styleUrl: './about.cta.scss',
})
export class AboutCta {
  private readonly profile = toSignal(inject(ProfileService).getPublicProfile(), { initialValue: null });
  protected readonly locale = inject(LandingLocaleService).locale;

  protected readonly heading = computed(
    () => getLocalized(this.profile()?.ctaHeading, this.locale()) || resolveCopy('about.cta.heading', this.locale())
  );
  protected readonly lede = computed(
    () => getLocalized(this.profile()?.ctaLede, this.locale()) || resolveCopy('about.cta.lede', this.locale())
  );

  protected readonly ctas = computed<readonly CtaItem[]>(() => {
    const p = this.profile();
    const items: CtaItem[] = [
      { id: 'contact', labelKey: 'about.cta.item.contact', href: '/contact', kind: 'internal' },
    ];

    const linkedin = p?.socialLinks?.find((s) => s.platform === 'LINKEDIN')?.url;
    if (linkedin) {
      items.push({ id: 'linkedin', labelKey: 'about.cta.item.linkedin', href: linkedin, kind: 'external' });
    }

    const github = p?.socialLinks?.find((s) => s.platform === 'GITHUB')?.url;
    if (github) {
      items.push({ id: 'github', labelKey: 'about.cta.item.github', href: github, kind: 'external' });
    }

    const cv = p?.resumeUrls?.en?.url ?? p?.resumeUrls?.vi?.url ?? null;
    if (cv) {
      items.push({ id: 'cv', labelKey: 'about.cta.item.cv', href: cv, kind: 'download' });
    }

    return items;
  });
}
