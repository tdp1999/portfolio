import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LandingLocaleService, RouterProgress, Shell } from '@portfolio/landing/shared/ui';
import { LandingMetaService, ProfileService } from '@portfolio/landing/shared/data-access';
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

  /** Reactive locale — switching the language switcher in the header triggers re-localization here. */
  readonly locale = this.localeService.locale;

  private readonly profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });

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

  constructor() {
    // Reset <title>/description to defaults on every navigation, so a page
    // that doesn't explicitly set them won't inherit the previous page's.
    inject(LandingMetaService).start();
  }
}
