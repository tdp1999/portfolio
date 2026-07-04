import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  Container,
  SectionHeader,
  Link,
  LandingLocaleService,
  UmamiEventDirective,
} from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'landing-home-get-in-touch',
  standalone: true,
  imports: [Container, SectionHeader, Link, UmamiEventDirective],
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
      ? 'Nhắn tin cho mình nha, mình đọc hết và thường phản hồi trong vài ngày.'
      : "Whatever the reason, the door's open.\nI read every message and usually reply within a few days."
  );

  protected readonly ctas = computed(() => {
    const vi = this.locale() === 'vi';
    return [
      {
        purpose: 'hire',
        label: vi ? 'Bàn bạc về một vị trí full-time' : "Let's talk about a full-time role",
        quiet: false,
      },
      {
        purpose: 'freelance',
        label: vi ? 'Nói về một dự án freelance' : 'Tell me about a freelance or contract project',
        quiet: false,
      },
      { purpose: 'hi', label: vi ? 'Hoặc chỉ muốn chào mình một tiếng' : 'Or just say hi', quiet: true },
    ] as const;
  });

  protected readonly fallbackPrompt = computed(() =>
    this.locale() === 'vi' ? 'Dùng email client của bạn:' : 'Prefer your own mail client?'
  );

  protected readonly mailtoHref = computed(() => {
    const email = this.fallbackEmail();
    return email ? `mailto:${email}` : '';
  });

  protected readonly email = this.fallbackEmail;
}
