import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MediaService } from '@portfolio/console/shared/data-access';
import { extractApiError, FormErrorPipe, maxDecimalsValidator } from '@portfolio/console/shared/util';
import {
  ChipToggleGroupComponent,
  ConfirmDialogComponent,
  ConfirmDialogData,
  FormSnapshotDirective,
  LongFormLayoutComponent,
  MediaPickerDialogComponent,
  MediaPickerDataSource,
  MediaPickerDialogData,
  ScrollspyRailComponent,
  SectionCardComponent,
  SectionDescriptor,
  SectionStatus,
  SpinnerOverlayComponent,
  ToastService,
  TranslatableGroupComponent,
} from '@portfolio/console/shared/ui';
import { HasUnsavedChanges } from '@portfolio/console/shared/util';
import { SidebarState } from '@portfolio/shared/ui/sidebar';
import { Observable, of, startWith, switchMap } from 'rxjs';
import {
  AVAILABILITY_OPTIONS,
  OPEN_TO_OPTIONS,
  PROFILE_SECTIONS,
  SOCIAL_PLATFORM_OPTIONS,
  TIMEZONE_OPTIONS,
} from '../profile.data';
import { ProfileService } from '../profile.service';
import { ProfileAdminResponse, SectionKey, UpdateSocialLinksPayload } from '../profile.types';

@Component({
  selector: 'console-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    JsonPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    ChipToggleGroupComponent,
    MatTooltipModule,
    SpinnerOverlayComponent,
    FormErrorPipe,
    LongFormLayoutComponent,
    ScrollspyRailComponent,
    SectionCardComponent,
    FormSnapshotDirective,
    TranslatableGroupComponent,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfilePageComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  // ── Injectors  ───────────────────────────────────────────────────────
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly mediaService = inject(MediaService);
  private readonly sidebarState = inject(SidebarState, { optional: true });
  private readonly mediaDataSource: MediaPickerDataSource = {
    list: (p) => this.mediaService.list(p),
    upload: (f, folder) => this.mediaService.upload(f, { folder }),
    getById: (id) => this.mediaService.getById(id),
    getByIdSilent: (id) => this.mediaService.getByIdSilent(id),
  };

  private readonly sidebarWasOpen = signal<boolean | null>(null);

  // ── Readonly Data  ───────────────────────────────────────────────────────
  readonly resumeLocales: { key: 'en' | 'vi'; label: string }[] = [
    { key: 'en', label: 'EN' },
    { key: 'vi', label: 'VI' },
  ];

  readonly availabilityOptions = AVAILABILITY_OPTIONS;
  readonly openToOptions = OPEN_TO_OPTIONS;
  readonly socialPlatformOptions = SOCIAL_PLATFORM_OPTIONS;
  readonly timezoneOptions = TIMEZONE_OPTIONS;
  readonly profileSections = PROFILE_SECTIONS;
  readonly sectionLabel = new Map<SectionKey, string>(
    PROFILE_SECTIONS.map((section) => [section.value, section.label])
  );

  // ── UI state ─────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly avatarSaving = signal(false);
  readonly ogImageSaving = signal(false);
  readonly avatarPreview = signal<string | null>(null);
  readonly ogImagePreview = signal<string | null>(null);
  readonly jsonLd = signal<unknown>(null);
  readonly showJsonLd = signal(false);
  readonly certModes = signal<('file' | 'link')[]>([]);

  // ── Parent FormGroup composed of 6 child FormGroups ──────────────────────
  readonly identityForm = this.fb.group({
    fullName: this.bilingualGroup({ required: true }),
    title: this.bilingualGroup({ required: true }),
    bioShort: this.bilingualGroup({ required: true, maxLength: 200 }),
    bioLong: this.bilingualGroup({ required: false }),
  });

  readonly workAvailabilityForm = this.fb.group({
    yearsOfExperience: this.fb.control(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(99), maxDecimalsValidator(1)],
    }),
    availability: this.fb.control<string>('EMPLOYED', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    openTo: this.fb.control<string[]>([], { nonNullable: true }),
    timezone: this.fb.control<string>('', { nonNullable: true }),
  });

  readonly contactForm = this.fb.group({
    email: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: this.fb.control('', { nonNullable: true }),
    preferredContactPlatform: this.fb.control<string>('GITHUB', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    preferredContactValue: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly locationForm = this.fb.group({
    locationCountry: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    locationCity: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    locationPostalCode: this.fb.control('', { nonNullable: true }),
    locationAddress1: this.fb.control('', { nonNullable: true }),
    locationAddress2: this.fb.control('', { nonNullable: true }),
  });

  readonly socialLinksForm = this.fb.group({
    socialLinks: this.fb.array<FormGroup>([]),
    resumeUrls: this.bilingualGroup({ required: false }),
    certifications: this.fb.array<FormGroup>([]),
  });

  readonly resumeNames = signal<{ en: string | null; vi: string | null }>({ en: null, vi: null });

  readonly seoOgForm = this.fb.group({
    metaTitle: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.maxLength(70)],
    }),
    metaDescription: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.maxLength(160)],
    }),
    canonicalUrl: this.fb.control('', { nonNullable: true }),
  });

  readonly form = this.fb.group({
    identity: this.identityForm,
    workAvailability: this.workAvailabilityForm,
    contact: this.contactForm,
    location: this.locationForm,
    socialLinks: this.socialLinksForm,
    seoOg: this.seoOgForm,
  });

  // ── Dedicated media state (not part of section save) ─────────────────────

  private readonly avatarId = signal<string | null>(null);
  private readonly ogImageId = signal<string | null>(null);

  // ── Per-section save state ───────────────────────────────────────────────

  readonly savingSignals: Record<SectionKey, Signal<boolean>>;
  readonly lastSavedSignals: Record<SectionKey, Signal<Date | null>>;
  readonly errorSignals: Record<SectionKey, Signal<string | null>>;

  private readonly saving = {
    identity: signal(false),
    workAvailability: signal(false),
    contact: signal(false),
    location: signal(false),
    socialLinks: signal(false),
    seoOg: signal(false),
  } satisfies Record<SectionKey, ReturnType<typeof signal<boolean>>>;

  private readonly lastSaved = {
    identity: signal<Date | null>(null),
    workAvailability: signal<Date | null>(null),
    contact: signal<Date | null>(null),
    location: signal<Date | null>(null),
    socialLinks: signal<Date | null>(null),
    seoOg: signal<Date | null>(null),
  } satisfies Record<SectionKey, ReturnType<typeof signal<Date | null>>>;

  private readonly errors = {
    identity: signal<string | null>(null),
    workAvailability: signal<string | null>(null),
    contact: signal<string | null>(null),
    location: signal<string | null>(null),
    socialLinks: signal<string | null>(null),
    seoOg: signal<string | null>(null),
  } satisfies Record<SectionKey, ReturnType<typeof signal<string | null>>>;

  /** Per-section dirty signal, updated from FormGroup events. */
  private readonly dirty = {
    identity: signal(false),
    workAvailability: signal(false),
    contact: signal(false),
    location: signal(false),
    socialLinks: signal(false),
    seoOg: signal(false),
  } satisfies Record<SectionKey, ReturnType<typeof signal<boolean>>>;

  /** Per-section validity signal, updated from FormGroup events. */
  private readonly invalid = {
    identity: signal(false),
    workAvailability: signal(false),
    contact: signal(false),
    location: signal(false),
    socialLinks: signal(false),
    seoOg: signal(false),
  } satisfies Record<SectionKey, ReturnType<typeof signal<boolean>>>;

  // ── Scrollspy rail section descriptors ───────────────────────────────────

  private readonly statusFor = (key: SectionKey): Signal<SectionStatus> =>
    computed<SectionStatus>(() => {
      if (this.errors[key]() || this.invalid[key]()) return 'error';
      // SectionStatus has no dedicated 'saving' variant; saving is rendered as 'editing'.
      if (this.saving[key]() || this.dirty[key]()) return 'editing';
      if (this.lastSaved[key]()) return 'saved';
      return 'untouched';
    });

  readonly sections: SectionDescriptor[] = [
    { id: 'section-identity', label: 'Identity', status: this.statusFor('identity') },
    {
      id: 'section-work-availability',
      label: 'Work & Availability',
      status: this.statusFor('workAvailability'),
    },
    { id: 'section-contact', label: 'Contact', status: this.statusFor('contact') },
    { id: 'section-location', label: 'Location', status: this.statusFor('location') },
    { id: 'section-social-links', label: 'Social Links', status: this.statusFor('socialLinks') },
    { id: 'section-seo-og', label: 'SEO / OG', status: this.statusFor('seoOg') },
  ];

  constructor() {
    this.savingSignals = {
      identity: this.saving.identity.asReadonly(),
      workAvailability: this.saving.workAvailability.asReadonly(),
      contact: this.saving.contact.asReadonly(),
      location: this.saving.location.asReadonly(),
      socialLinks: this.saving.socialLinks.asReadonly(),
      seoOg: this.saving.seoOg.asReadonly(),
    };
    this.lastSavedSignals = {
      identity: this.lastSaved.identity.asReadonly(),
      workAvailability: this.lastSaved.workAvailability.asReadonly(),
      contact: this.lastSaved.contact.asReadonly(),
      location: this.lastSaved.location.asReadonly(),
      socialLinks: this.lastSaved.socialLinks.asReadonly(),
      seoOg: this.lastSaved.seoOg.asReadonly(),
    };
    this.errorSignals = {
      identity: this.errors.identity.asReadonly(),
      workAvailability: this.errors.workAvailability.asReadonly(),
      contact: this.errors.contact.asReadonly(),
      location: this.errors.location.asReadonly(),
      socialLinks: this.errors.socialLinks.asReadonly(),
      seoOg: this.errors.seoOg.asReadonly(),
    };

    // Wire dirty/invalid signals from each child FormGroup's events.
    this.wireFormStateSignal('identity', this.identityForm);
    this.wireFormStateSignal('workAvailability', this.workAvailabilityForm);
    this.wireFormStateSignal('contact', this.contactForm);
    this.wireFormStateSignal('location', this.locationForm);
    this.wireFormStateSignal('socialLinks', this.socialLinksForm);
    this.wireFormStateSignal('seoOg', this.seoOgForm);
  }

  ngOnInit(): void {
    // Collapse the main sidebar so the long-form page has more horizontal room.
    // if (this.sidebarState) {
    //   this.sidebarWasOpen.set(this.sidebarState.isOpen());
    //   this.sidebarState.setOpen(false);
    // }
    this.loadProfile();
  }

  ngOnDestroy(): void {
    // Restore sidebar to its previous state on leave.
    const prev = this.sidebarWasOpen();
    if (this.sidebarState && prev !== null) {
      this.sidebarState.setOpen(prev);
    }
  }

  // ── UnsavedChangesGuard contract ─────────────────────────────────────────

  readonly isDirty = computed(
    () =>
      this.dirty.identity() ||
      this.dirty.workAvailability() ||
      this.dirty.contact() ||
      this.dirty.location() ||
      this.dirty.socialLinks() ||
      this.dirty.seoOg()
  );

  hasUnsavedChanges(): Signal<boolean> {
    return this.isDirty;
  }

  // ── Loading & patching ───────────────────────────────────────────────────

  private loadProfile(): void {
    this.loading.set(true);
    this.profileService
      .getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.loading.set(false);
          this.patchForm(profile);
        },
        error: (err) => {
          this.loading.set(false);
          const apiError = extractApiError(err);
          if (apiError?.statusCode !== 404) {
            this.toast.error('Failed to load profile');
          }
        },
      });
  }

  private patchForm(profile: ProfileAdminResponse): void {
    this.identityForm.reset({
      fullName: { en: profile.fullName.en, vi: profile.fullName.vi },
      title: { en: profile.title.en, vi: profile.title.vi },
      bioShort: { en: profile.bioShort.en, vi: profile.bioShort.vi },
      bioLong: { en: profile.bioLong?.en ?? '', vi: profile.bioLong?.vi ?? '' },
    });

    this.workAvailabilityForm.reset({
      yearsOfExperience: profile.yearsOfExperience,
      availability: profile.availability,
      openTo: profile.openTo,
      timezone: profile.timezone ?? '',
    });

    this.contactForm.reset({
      email: profile.email,
      phone: profile.phone ?? '',
      preferredContactPlatform: profile.preferredContactPlatform,
      preferredContactValue: profile.preferredContactValue,
    });

    this.locationForm.reset({
      locationCountry: profile.locationCountry,
      locationCity: profile.locationCity,
      locationPostalCode: profile.locationPostalCode ?? '',
      locationAddress1: profile.locationAddress1 ?? '',
      locationAddress2: profile.locationAddress2 ?? '',
    });

    this.socialLinksForm.controls.socialLinks.clear();
    for (const link of profile.socialLinks) {
      this.socialLinksForm.controls.socialLinks.push(
        this.createSocialLinkGroup(link.platform, link.url, link.handle ?? '')
      );
    }
    this.socialLinksForm.controls.certifications.clear();
    for (const cert of profile.certifications) {
      this.socialLinksForm.controls.certifications.push(
        this.createCertificationGroup(cert.name, cert.issuer, cert.year, cert.url ?? '')
      );
    }
    this.certModes.set(profile.certifications.map((c) => this.inferCertMode(c.url ?? '')));
    this.socialLinksForm.controls.resumeUrls.reset({
      en: profile.resumeUrls.en?.url ?? '',
      vi: profile.resumeUrls.vi?.url ?? '',
    });
    this.resumeNames.set({
      en: profile.resumeUrls.en?.name ?? null,
      vi: profile.resumeUrls.vi?.name ?? null,
    });
    this.socialLinksForm.markAsPristine();

    this.seoOgForm.reset({
      metaTitle: profile.metaTitle ?? '',
      metaDescription: profile.metaDescription ?? '',
      canonicalUrl: profile.canonicalUrl ?? '',
    });

    this.avatarId.set(profile.avatarId);
    this.ogImageId.set(profile.ogImageId);
    this.avatarPreview.set(profile.avatarUrl);
    this.ogImagePreview.set(profile.ogImageUrl);
  }

  // ── Social Links / Certification FormGroup builders ──────────────────────

  private createSocialLinkGroup(platform = 'GITHUB', url = '', handle = ''): FormGroup {
    return this.fb.group({
      platform: this.fb.control(platform, { nonNullable: true, validators: [Validators.required] }),
      url: this.fb.control(url, {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^https?:\/\/.+/)],
      }),
      handle: this.fb.control(handle, { nonNullable: true }),
    });
  }

  private createCertificationGroup(name = '', issuer = '', year = new Date().getFullYear(), url = ''): FormGroup {
    return this.fb.group({
      name: this.fb.control(name, { nonNullable: true, validators: [Validators.required] }),
      issuer: this.fb.control(issuer, { nonNullable: true, validators: [Validators.required] }),
      year: this.fb.control(year, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1990), Validators.max(2100)],
      }),
      url: this.fb.control(url, { nonNullable: true }),
    });
  }

  addSocialLink(): void {
    this.socialLinksForm.controls.socialLinks.push(this.createSocialLinkGroup());
    this.socialLinksForm.controls.socialLinks.markAsDirty();
  }

  removeSocialLink(index: number): void {
    this.socialLinksForm.controls.socialLinks.removeAt(index);
    this.socialLinksForm.controls.socialLinks.markAsDirty();
  }

  addCertification(): void {
    this.socialLinksForm.controls.certifications.push(this.createCertificationGroup());
    this.socialLinksForm.controls.certifications.markAsDirty();
    this.certModes.update((modes) => [...modes, 'link']);
  }

  removeCertification(index: number): void {
    this.socialLinksForm.controls.certifications.removeAt(index);
    this.socialLinksForm.controls.certifications.markAsDirty();
    this.certModes.update((modes) => modes.filter((_, i) => i !== index));
  }

  setCertMode(index: number, mode: 'file' | 'link'): void {
    this.certModes.update((modes) => modes.map((m, i) => (i === index ? mode : m)));
  }

  openCertPicker(index: number): void {
    const certsArray = this.socialLinksForm.controls.certifications;
    const certGroup = certsArray.at(index) as FormGroup;
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, string | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'application/pdf',
          defaultFolder: 'general',
          dataSource: this.mediaDataSource,
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((id) => (id ? this.mediaService.getById(id) : of(null)))
      )
      .subscribe((item) => {
        if (!item) return;
        certGroup.controls['url'].setValue(item.url);
        certsArray.markAsDirty();
      });
  }

  certFileLabel(url: string): string {
    const segments = url.split('/');
    return segments[segments.length - 1].split('?')[0] || url;
  }

  /**
   * FormSnapshotDirective rebuild callback for the social-links section.
   * Required because `FormGroup.reset()` can't grow FormArrays that shrank;
   * this re-pushes groups using the same factories as initial load.
   */
  readonly rebuildSocialLinks = (snap: unknown): void => {
    const s = snap as {
      socialLinks: Array<{ platform: string; url: string; handle: string }>;
      certifications: Array<{ name: string; issuer: string; year: number; url: string }>;
      resumeUrls: { en: string; vi: string };
    };
    const links = this.socialLinksForm.controls.socialLinks;
    const certs = this.socialLinksForm.controls.certifications;
    links.clear();
    for (const l of s.socialLinks) links.push(this.createSocialLinkGroup(l.platform, l.url, l.handle));
    certs.clear();
    for (const c of s.certifications) certs.push(this.createCertificationGroup(c.name, c.issuer, c.year, c.url));
    this.certModes.set(s.certifications.map((c) => this.inferCertMode(c.url)));
    this.socialLinksForm.controls.resumeUrls.reset(s.resumeUrls);
  };

  // ── Per-section save handlers ────────────────────────────────────────────

  saveIdentity(): void {
    this.runSectionSave('identity', this.identityForm, () =>
      this.profileService.updateIdentity(this.identityForm.getRawValue())
    );
  }

  saveWorkAvailability(): void {
    const v = this.workAvailabilityForm.getRawValue();
    this.runSectionSave('workAvailability', this.workAvailabilityForm, () =>
      this.profileService.updateWorkAvailability({ ...v, timezone: v.timezone || null })
    );
  }

  saveContact(): void {
    const v = this.contactForm.getRawValue();
    this.runSectionSave('contact', this.contactForm, () =>
      this.profileService.updateContact({ ...v, phone: v.phone || null })
    );
  }

  saveLocation(): void {
    const v = this.locationForm.getRawValue();
    this.runSectionSave('location', this.locationForm, () =>
      this.profileService.updateLocation({
        ...v,
        locationPostalCode: v.locationPostalCode || null,
        locationAddress1: v.locationAddress1 || null,
        locationAddress2: v.locationAddress2 || null,
      })
    );
  }

  saveSocialLinks(): void {
    const v = this.socialLinksForm.getRawValue();
    const names = this.resumeNames();
    const payload: UpdateSocialLinksPayload = {
      socialLinks: (v.socialLinks as Array<{ platform: string; url: string; handle: string }>).map((l) => ({
        ...l,
        handle: l.handle || undefined,
      })),
      resumeUrls: {
        en: v.resumeUrls['en'] ? { url: v.resumeUrls['en'], name: names.en ?? v.resumeUrls['en'] } : undefined,
        vi: v.resumeUrls['vi'] ? { url: v.resumeUrls['vi'], name: names.vi ?? v.resumeUrls['vi'] } : undefined,
      },
      certifications: (v.certifications as Array<{ name: string; issuer: string; year: number; url: string }>).map(
        (c) => ({ ...c, url: c.url || undefined })
      ),
    };
    this.runSectionSave('socialLinks', this.socialLinksForm, () => this.profileService.updateSocialLinks(payload));
  }

  saveSeoOg(): void {
    const v = this.seoOgForm.getRawValue();
    this.runSectionSave('seoOg', this.seoOgForm, () =>
      this.profileService.updateSeoOg({
        metaTitle: v.metaTitle || null,
        metaDescription: v.metaDescription || null,
        canonicalUrl: v.canonicalUrl || null,
      })
    );
  }

  // ── Save orchestration (optimistic update + rollback on error) ───────────

  private runSectionSave(key: SectionKey, form: FormGroup, call: () => Observable<void>): void {
    if (form.invalid) {
      form.markAllAsTouched();
      this.errors[key].set('Fix errors before saving');
      return;
    }

    this.saving[key].set(true);
    this.errors[key].set(null);

    call()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving[key].set(false);
          form.markAsPristine();
          this.lastSaved[key].set(new Date());
          this.toast.success(`${this.sectionLabel.get(key)} saved`);
        },
        error: (err) => {
          this.saving[key].set(false);
          const apiError = extractApiError(err);
          const message = apiError?.message ?? `Failed to save ${this.sectionLabel.get(key)}`;
          this.errors[key].set(message);
          this.toast.error(message);
        },
      });
  }

  // ── Avatar / OG image (picker-based, save-on-select) ─────────────────────

  openAvatarPicker(): void {
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, string | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'image/',
          defaultFolder: 'avatars',
          selectedIds: this.avatarId() ? [this.avatarId()!] : [],
          dataSource: this.mediaDataSource,
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id === undefined) return;
        this.avatarSaving.set(true);
        this.profileService
          .updateAvatar(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: ({ avatarUrl }) => {
              this.avatarSaving.set(false);
              this.avatarId.set(id);
              this.avatarPreview.set(avatarUrl);
              this.toast.success('Avatar updated');
            },
            error: () => {
              this.avatarSaving.set(false);
              this.toast.error('Avatar update failed');
            },
          });
      });
  }

  confirmClearAvatar(): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: { title: 'Remove Avatar', message: 'Remove your avatar photo?', confirmLabel: 'Remove' },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.clearAvatar();
      });
  }

  private clearAvatar(): void {
    this.avatarSaving.set(true);
    this.profileService
      .updateAvatar(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.avatarSaving.set(false);
          this.avatarId.set(null);
          this.avatarPreview.set(null);
        },
        error: () => {
          this.avatarSaving.set(false);
          this.toast.error('Failed to remove avatar');
        },
      });
  }

  openOgImagePicker(): void {
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, string | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'image/',
          defaultFolder: 'logos',
          selectedIds: this.ogImageId() ? [this.ogImageId()!] : [],
          dataSource: this.mediaDataSource,
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id === undefined) return;
        this.ogImageSaving.set(true);
        this.profileService
          .updateOgImage(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: ({ ogImageUrl }) => {
              this.ogImageSaving.set(false);
              this.ogImageId.set(id);
              this.ogImagePreview.set(ogImageUrl);
              this.toast.success('OG image updated');
            },
            error: () => {
              this.ogImageSaving.set(false);
              this.toast.error('OG image update failed');
            },
          });
      });
  }

  confirmClearOgImage(): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: { title: 'Remove OG Image', message: 'Remove your OG preview image?', confirmLabel: 'Remove' },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.clearOgImage();
      });
  }

  private clearOgImage(): void {
    this.ogImageSaving.set(true);
    this.profileService
      .updateOgImage(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.ogImageSaving.set(false);
          this.ogImageId.set(null);
          this.ogImagePreview.set(null);
        },
        error: () => {
          this.ogImageSaving.set(false);
          this.toast.error('Failed to remove OG image');
        },
      });
  }

  // ── Resume URL pickers (picker-based, written into form) ─────────────────

  openResumePicker(locale: 'en' | 'vi'): void {
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, string | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'application/pdf',
          defaultFolder: 'resumes',
          dataSource: this.mediaDataSource,
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((id) => (id ? this.mediaService.getById(id) : of(null)))
      )
      .subscribe((item) => {
        if (!item) return;
        this.socialLinksForm.controls.resumeUrls.controls[locale].setValue(item.url);
        this.socialLinksForm.controls.resumeUrls.markAsDirty();
        this.resumeNames.update((n) => ({ ...n, [locale]: item.originalFilename }));
      });
  }

  clearResumeUrl(locale: 'en' | 'vi'): void {
    this.socialLinksForm.controls.resumeUrls.controls[locale].setValue('');
    this.socialLinksForm.controls.resumeUrls.markAsDirty();
    this.resumeNames.update((n) => ({ ...n, [locale]: null }));
  }

  // ── JSON-LD preview ──────────────────────────────────────────────────────

  loadJsonLd(): void {
    this.profileService
      .getJsonLd()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.jsonLd.set(data);
          this.showJsonLd.set(true);
        },
        error: () => this.toast.error('Failed to load JSON-LD'),
      });
  }

  // ── Template helpers ─────────────────────────────────────────────────────

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private inferCertMode(url: string): 'file' | 'link' {
    return url.includes('res.cloudinary.com') ? 'file' : 'link';
  }

  private bilingualGroup(opts: { required: boolean; maxLength?: number }) {
    const validators = [];
    if (opts.required) validators.push(Validators.required);
    if (opts.maxLength !== undefined) validators.push(Validators.maxLength(opts.maxLength));
    return this.fb.group({
      en: this.fb.control('', { nonNullable: true, validators }),
      vi: this.fb.control('', { nonNullable: true, validators }),
    });
  }

  private wireFormStateSignal(key: SectionKey, fg: FormGroup): void {
    fg.events.pipe(startWith(null), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty[key].set(fg.dirty);
      this.invalid[key].set(fg.invalid);
      if (fg.dirty && this.errors[key]()) this.errors[key].set(null);
    });
  }
}
