import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  type Signal,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MediaService } from '@portfolio/console/shared/data-access';
import {
  HasUnsavedChanges,
  MediaPickerDataSource,
  SectionTabGroup,
  SectionTabs,
  SpinnerOverlay,
  onBeforeUnload,
} from '@portfolio/console/shared/ui';
import { extractApiError } from '@portfolio/console/shared/util';
import { SidebarState } from '@portfolio/shared/ui';
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
    SectionTabs,
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
    update: (id, payload) => this.mediaService.update(id, payload),
  };

  readonly loading = signal(false);
  readonly profile = signal<ProfileAdminResponse | null>(null);

  // ── Section refs (for tab status wiring) ──────────────────────────────────
  private readonly identitySection = viewChild.required(ProfileIdentitySection);
  private readonly workSection = viewChild.required(ProfileWorkAvailabilitySection);
  private readonly contactSection = viewChild.required(ProfileContactSection);
  private readonly locationSection = viewChild.required(ProfileLocationSection);
  private readonly socialLinksSection = viewChild.required(ProfileSocialLinksSection);
  private readonly landingContentSection = viewChild.required(ProfileLandingContentSection);
  private readonly seoOgSection = viewChild.required(ProfileSeoOgSection);
  private readonly adminSection = viewChild.required(ProfileAdminContactAddressSection);

  // ── Tab IA: grouped rail. The three "Landing copy" sub-tabs share the single
  // landing-content section instance + form + save, so they surface one status.
  readonly groups: SectionTabGroup[] = [
    {
      label: 'Profile',
      sections: [
        { id: 'section-identity', label: 'Identity', status: computed(() => this.identitySection().status()) },
        {
          id: 'section-work-availability',
          label: 'Work & Availability',
          status: computed(() => this.workSection().status()),
        },
        { id: 'section-contact', label: 'Contact', status: computed(() => this.contactSection().status()) },
        { id: 'section-location', label: 'Location', status: computed(() => this.locationSection().status()) },
        {
          id: 'section-social-links',
          label: 'Social Links',
          status: computed(() => this.socialLinksSection().status()),
        },
      ],
    },
    {
      label: 'Landing copy',
      sections: [
        {
          id: 'section-landing-home',
          label: 'Home page',
          status: computed(() => this.landingContentSection().status()),
        },
        {
          id: 'section-landing-footer',
          label: 'Footer',
          status: computed(() => this.landingContentSection().status()),
        },
        {
          id: 'section-landing-about',
          label: 'About page',
          status: computed(() => this.landingContentSection().status()),
        },
      ],
    },
    {
      label: 'Meta',
      sections: [
        { id: 'section-seo-og', label: 'SEO / OG', status: computed(() => this.seoOgSection().status()) },
        {
          id: 'section-admin-contact-address',
          label: 'Admin Contact & Address',
          status: computed(() => this.adminSection().status()),
        },
      ],
    },
  ];

  readonly activeId = signal<string>('section-identity');
  readonly showAll = signal(false);

  // The three landing sub-tabs share one section instance; it is visible whenever
  // any of them is active, and receives the active id to pick the sub-card.
  readonly isLandingActive = computed(() => this.activeId().startsWith('section-landing-'));
  readonly activeLandingSubTab = computed(() => (this.isLandingActive() ? this.activeId() : 'section-landing-home'));

  // ── UnsavedChangesGuard contract ──────────────────────────────────────────
  //
  // Each section owns one form and its own `dirty` signal; the page is dirty when any of them is.
  // Reading the `viewChild.required` refs here is safe for the whole lifetime of the page because
  // the tab rail hides inactive sections with `[hidden]` rather than destroying them — all eight
  // are in the DOM from first render, which is also what makes the rail's per-section status work.
  //
  // No `onSaveAndContinue`: with eight independent endpoints, "save everything" would have to
  // decide what to do when one section is invalid and another already committed, so the dialog
  // offers Stay or Discard only.
  readonly isDirty = computed(
    () =>
      this.identitySection().dirty() ||
      this.workSection().dirty() ||
      this.contactSection().dirty() ||
      this.locationSection().dirty() ||
      this.socialLinksSection().dirty() ||
      this.landingContentSection().dirty() ||
      this.seoOgSection().dirty() ||
      this.adminSection().dirty()
  );

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

  /** See `isDirty` for why the aggregation is safe and why there is no `onSaveAndContinue`. */
  hasUnsavedChanges(): Signal<boolean> {
    return this.isDirty;
  }

  /** Covers a browser reload or tab close, which the router guard never sees. */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    onBeforeUnload(event, this.isDirty());
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
