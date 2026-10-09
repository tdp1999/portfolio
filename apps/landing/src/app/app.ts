import { afterNextRender, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LandingLocaleService, RouterProgress, Shell, LandingMetaService } from '@portfolio/landing/shared/ui';
import { LandingAuthService, ProfileService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';

@Component({
  imports: [RouterModule, Shell, RouterProgress],
  selector: 'landing-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly profileService = inject(ProfileService);
  private readonly localeService = inject(LandingLocaleService);

  private readonly profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });

  /** Reactive locale — switching the language switcher in the header triggers re-localization here. */
  readonly locale = this.localeService.locale;

  readonly fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale()));
  readonly email = computed(() => this.profile()?.email ?? '');
  readonly footerTagline = computed(() => getLocalized(this.profile()?.footerTagline, this.locale()));
  readonly socialLinks = computed(() => this.profile()?.socialLinks ?? []);

  private readonly resumeEntry = computed(() => {
    const urls = this.profile()?.resumeUrls;
    if (!urls) return null;
    return this.locale() === 'vi' ? (urls.vi ?? urls.en ?? null) : (urls.en ?? urls.vi ?? null);
  });

  readonly resumeUrl = computed(() => this.resumeEntry()?.url ?? '');
  readonly resumeName = computed(() => this.resumeEntry()?.name ?? 'CV');

  /** App-wide Owner session: the header swaps "Sign in" for the Workspace menu on it, private pages gate on it. */
  private readonly auth = inject(LandingAuthService);
  readonly signedIn = computed(() => this.auth.status() === 'signed-in');

  constructor() {
    // After the first render, so the restored session never changes the DOM mid-hydration. Costs a
    // request only when the `csrf_token` cookie exists, i.e. only for the Owner.
    afterNextRender(() => void this.auth.restore());

    // Reset <title>/description to defaults on every navigation, so a page
    // that doesn't explicitly set them won't inherit the previous page's.
    inject(LandingMetaService).start();
  }
}
