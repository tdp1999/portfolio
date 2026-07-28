import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  Container,
  SectionHeader,
  Link,
  LandingLocaleService,
  UmamiEventDirective,
  T,
  LandingCopyPipe,
  LandingCopyService,
  resolveCopy,
} from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'landing-home-get-in-touch',
  standalone: true,
  imports: [Container, SectionHeader, Link, UmamiEventDirective, T, LandingCopyPipe],
  templateUrl: './home.get-in-touch.html',
  styleUrl: './home.get-in-touch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeGetInTouch {
  protected readonly locale = inject(LandingLocaleService).locale;
  private readonly copyService = inject(LandingCopyService);
  private readonly profile = toSignal(inject(ProfileService).getPublicProfile(), { initialValue: null });

  private readonly fallbackEmail = computed(() => this.profile()?.email ?? '');

  protected readonly lede = this.copyService.t('home.getInTouch.copy');

  protected readonly ctas = computed(() => {
    const locale = this.locale();
    return [
      { purpose: 'hire', label: resolveCopy('home.getInTouch.cta.hire', locale), quiet: false },
      { purpose: 'freelance', label: resolveCopy('home.getInTouch.cta.freelance', locale), quiet: false },
      { purpose: 'hi', label: resolveCopy('home.getInTouch.cta.hi', locale), quiet: true },
    ] as const;
  });

  protected readonly fallbackPrompt = this.copyService.t('home.getInTouch.fallbackPrompt');

  protected readonly mailtoHref = computed(() => {
    const email = this.fallbackEmail();
    return email ? `mailto:${email}` : '';
  });

  protected readonly email = this.fallbackEmail;
}
