import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Container, Eyebrow, Heading, Link, LandingLocaleService } from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'landing-home-get-in-touch',
  standalone: true,
  imports: [Container, Eyebrow, Heading, Link],
  templateUrl: './home.get-in-touch.html',
  styleUrl: './home.get-in-touch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeGetInTouch {
  private readonly locale = inject(LandingLocaleService).locale;
  private readonly profile = toSignal(inject(ProfileService).getPublicProfile(), { initialValue: null });

  private readonly fallbackEmail = computed(() => this.profile()?.email ?? '');

  protected readonly copy = computed(() =>
    this.locale() === 'vi'
      ? 'Mình ở TP.HCM, đang mở cho vị trí toàn thời gian và một ít freelance song song. Thường phản hồi trong vài ngày.'
      : "I'm in HCMC, open to full-time roles and a small slice of freelance on the side. Usually reply within a few days."
  );

  protected readonly ctas = computed(() => {
    const vi = this.locale() === 'vi';
    return [
      {
        purpose: 'hire',
        label: vi ? 'Trò chuyện về vị trí toàn thời gian' : "Let's talk about a full-time role",
        quiet: false,
      },
      {
        purpose: 'freelance',
        label: vi ? 'Kể mình nghe về dự án freelance' : 'Tell me about a freelance project',
        quiet: false,
      },
      { purpose: 'hi', label: vi ? 'Hoặc chỉ chào một tiếng' : 'Or just say hi', quiet: true },
    ] as const;
  });

  protected readonly fallbackPrompt = computed(() =>
    this.locale() === 'vi' ? 'Thích dùng email client của bạn?' : 'Prefer your own mail client?'
  );

  protected readonly mailtoHref = computed(() => {
    const email = this.fallbackEmail();
    return email ? `mailto:${email}` : '';
  });

  protected readonly email = this.fallbackEmail;
}
