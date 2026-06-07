import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaService } from '@portfolio/console/shared/data-access';
import {
  LongFormLayout,
  MediaPickerDataSource,
  ScrollspyRail,
  SectionDescriptor,
  SpinnerOverlay,
} from '@portfolio/console/shared/ui';
import { extractApiError } from '@portfolio/console/shared/util';
import { HasUnsavedChanges } from '@portfolio/console/shared/util';
import { SidebarState } from '@portfolio/shared/ui/sidebar';
import { ProfileAdminContactAddressSection } from '../sections/profile-admin-contact-address.section/profile-admin-contact-address.section';
import { ProfileContactSection } from '../sections/profile-contact.section/profile-contact.section';
import { ProfileIdentitySection } from '../sections/profile-identity.section/profile-identity.section';
import { ProfileLandingContentSection } from '../sections/profile-landing-content.section/profile-landing-content.section';
import { ProfileLocationSection } from '../sections/profile-location.section/profile-location.section';
import { ProfileSeoOgSection } from '../sections/profile-seo-og.section/profile-seo-og.section';
import { ProfileSocialLinksSection } from '../sections/profile-social-links.section/profile-social-links.section';
import { ProfileWorkAvailabilitySection } from '../sections/profile-work-availability.section/profile-work-availability.section';
import { ProfileService } from '../profile.service';
import { ProfileAdminResponse } from '../profile.types';

@Component({
  selector: 'console-profile',
  standalone: true,
  imports: [
    SpinnerOverlay,
    LongFormLayout,
    ScrollspyRail,
    ProfileIdentitySection,
    ProfileWorkAvailabilitySection,
    ProfileContactSection,
    ProfileLocationSection,
    ProfileSocialLinksSection,
    ProfileLandingContentSection,
    ProfileSeoOgSection,
    ProfileAdminContactAddressSection,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Profile implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly profileService = inject(ProfileService);
  private readonly mediaService = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sidebarState = inject(SidebarState, { optional: true });
  private readonly sidebarWasOpen = signal<boolean | null>(null);

  readonly mediaDataSource: MediaPickerDataSource = {
    list: (p) => this.mediaService.list(p),
    upload: (f, folder) => this.mediaService.upload(f, { folder }),
    getById: (id) => this.mediaService.getById(id),
    getByIdSilent: (id) => this.mediaService.getByIdSilent(id),
  };

  readonly loading = signal(false);
  readonly profile = signal<ProfileAdminResponse | null>(null);

  // ── Section refs (for scrollspy rail status wiring) ───────────────────────
  private readonly identitySection = viewChild.required(ProfileIdentitySection);
  private readonly workSection = viewChild.required(ProfileWorkAvailabilitySection);
  private readonly contactSection = viewChild.required(ProfileContactSection);
  private readonly locationSection = viewChild.required(ProfileLocationSection);
  private readonly socialLinksSection = viewChild.required(ProfileSocialLinksSection);
  private readonly landingContentSection = viewChild.required(ProfileLandingContentSection);
  private readonly seoOgSection = viewChild.required(ProfileSeoOgSection);
  private readonly adminSection = viewChild.required(ProfileAdminContactAddressSection);

  readonly sections: SectionDescriptor[] = [
    { id: 'section-identity', label: 'Identity', status: computed(() => this.identitySection().status()) },
    {
      id: 'section-work-availability',
      label: 'Work & Availability',
      status: computed(() => this.workSection().status()),
    },
    { id: 'section-contact', label: 'Contact', status: computed(() => this.contactSection().status()) },
    { id: 'section-location', label: 'Location', status: computed(() => this.locationSection().status()) },
    { id: 'section-social-links', label: 'Social Links', status: computed(() => this.socialLinksSection().status()) },
    {
      id: 'section-landing-content',
      label: 'Landing Content',
      status: computed(() => this.landingContentSection().status()),
    },
    { id: 'section-seo-og', label: 'SEO / OG', status: computed(() => this.seoOgSection().status()) },
    {
      id: 'section-admin-contact-address',
      label: 'Admin Contact & Address',
      status: computed(() => this.adminSection().status()),
    },
  ];

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    const prev = this.sidebarWasOpen();
    if (this.sidebarState && prev !== null) {
      this.sidebarState.setOpen(prev);
    }
  }

  /**
   * Merges a partial section save into the in-memory profile so sibling sections that
   * read passthrough fields (e.g. AdminContactAddress reading email/country) stay in sync.
   */
  onSectionSaved(patch: Partial<ProfileAdminResponse>): void {
    const current = this.profile();
    if (!current) return;
    this.profile.set({ ...current, ...patch });
  }

  // ── UnsavedChangesGuard contract — sections own their own dirty state, so the
  // parent can't easily compute a global dirty signal without leaking each section's
  // form internals. The route guard is informational; sections persist on Save click.
  // Returning a constant `false` accepts navigation; if guards want to be stricter,
  // each section can expose a `dirty` signal we aggregate here later.
  hasUnsavedChanges() {
    return signal(false);
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.profileService
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.loading.set(false);
          this.profile.set(profile);
        },
        error: (err) => {
          this.loading.set(false);
          // Intentionally swallow 404: a fresh account legitimately has no profile yet,
          // and the user lands here precisely to create one. Other errors fall through to
          // the global handler's toast via the dictionary.
          const apiError = extractApiError(err);
          if (apiError?.statusCode !== 404) return;
        },
      });
  }
}
