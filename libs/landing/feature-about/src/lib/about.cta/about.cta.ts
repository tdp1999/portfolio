import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { Container, Eyebrow, Heading, Link, LandingLocaleService } from '@portfolio/landing/shared/ui';
import { getLocalized } from '@portfolio/shared/utils/lite';

type CtaItem = {
  readonly id: 'contact' | 'linkedin' | 'github' | 'cv';
  readonly labelEn: string;
  readonly labelVi: string;
  readonly href: string;
  readonly kind?: 'internal' | 'external' | 'download';
};

const DEFAULT_HEADING_BY_LOCALE = {
  en: 'If any of this resonated, the door is open.',
  vi: 'Nếu bạn thấy hợp, cứ gõ cửa.',
} as const;
const DEFAULT_LEDE_BY_LOCALE = {
  en: 'Engagement, freelance, or a long-form conversation about a hard system — pick the door that fits.',
  vi: 'Hợp tác, freelance, hay một cuộc trò chuyện sâu về hệ thống khó — chọn cánh cửa phù hợp.',
} as const;

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
  imports: [Container, Eyebrow, Heading, Link],
  templateUrl: './about.cta.html',
  styleUrl: './about.cta.scss',
})
export class AboutCta {
  private readonly profile = toSignal(inject(ProfileService).getPublicProfile(), { initialValue: null });
  protected readonly locale = inject(LandingLocaleService).locale;

  protected readonly heading = computed(
    () => getLocalized(this.profile()?.ctaHeading, this.locale()) || DEFAULT_HEADING_BY_LOCALE[this.locale()]
  );
  protected readonly lede = computed(
    () => getLocalized(this.profile()?.ctaLede, this.locale()) || DEFAULT_LEDE_BY_LOCALE[this.locale()]
  );

  protected readonly ctas = computed<readonly CtaItem[]>(() => {
    const p = this.profile();
    const items: CtaItem[] = [
      { id: 'contact', labelEn: 'Get in touch', labelVi: 'Liên hệ', href: '/contact', kind: 'internal' },
    ];

    const linkedin = p?.socialLinks?.find((s) => s.platform === 'LINKEDIN')?.url;
    if (linkedin) {
      items.push({ id: 'linkedin', labelEn: 'LinkedIn', labelVi: 'LinkedIn', href: linkedin, kind: 'external' });
    }

    const github = p?.socialLinks?.find((s) => s.platform === 'GITHUB')?.url;
    if (github) {
      items.push({ id: 'github', labelEn: 'GitHub', labelVi: 'GitHub', href: github, kind: 'external' });
    }

    const cv = p?.resumeUrls?.en?.url ?? p?.resumeUrls?.vi?.url ?? null;
    if (cv) {
      items.push({ id: 'cv', labelEn: 'Download CV', labelVi: 'Tải CV', href: cv, kind: 'download' });
    }

    return items;
  });
}
