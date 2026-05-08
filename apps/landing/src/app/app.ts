import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LandingShellComponent } from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';

@Component({
  imports: [RouterModule, LandingShellComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private profileService = inject(ProfileService);

  /** Same locale logic as feature-home — landing is single-locale (`en`) until i18n lands. */
  private readonly locale = 'en' as const;
  private readonly profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });

  readonly fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale));
  readonly email = computed(() => this.profile()?.email ?? '');
  readonly footerTagline = computed(() => getLocalized(this.profile()?.footerTagline, this.locale));
  readonly socialLinks = computed(() => this.profile()?.socialLinks ?? []);
}
