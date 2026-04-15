import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { extractApiError, FormErrorPipe } from '@portfolio/console/shared/data-access';
import {
  LongFormLayoutComponent,
  ScrollspyRailComponent,
  SectionCardComponent,
  SectionDescriptor,
  SectionStatus,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { HasUnsavedChanges } from '@portfolio/console/shared/util';
import { SidebarState } from '@portfolio/shared/ui/sidebar';
import { Observable } from 'rxjs';
import { ProfileService } from '../profile.service';
import {
  OptionalTranslatableValue,
  ProfileAdminResponse,
  TranslatableValue,
  UpdateContactPayload,
  UpdateIdentityPayload,
  UpdateLocationPayload,
  UpdateSeoOgPayload,
  UpdateSocialLinksPayload,
  UpdateWorkAvailabilityPayload,
} from '../profile.types';

const AVAILABILITY_OPTIONS = [
  { value: 'EMPLOYED', label: 'Employed' },
  { value: 'OPEN_TO_WORK', label: 'Open to Work' },
  { value: 'FREELANCING', label: 'Freelancing' },
  { value: 'NOT_AVAILABLE', label: 'Not Available' },
] as const;

const OPEN_TO_OPTIONS = [
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'SIDE_PROJECT', label: 'Side Project' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'SPEAKING', label: 'Speaking' },
  { value: 'OPEN_SOURCE', label: 'Open Source' },
] as const;

const SOCIAL_PLATFORM_OPTIONS = [
  { value: 'GITHUB', label: 'GitHub' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'TWITTER', label: 'Twitter / X' },
  { value: 'BLUESKY', label: 'Bluesky' },
  { value: 'STACKOVERFLOW', label: 'Stack Overflow' },
  { value: 'DEV_TO', label: 'Dev.to' },
  { value: 'HASHNODE', label: 'Hashnode' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'OTHER', label: 'Other' },
] as const;

const TIMEZONE_OPTIONS = [
  'UTC',
  'Asia/Ho_Chi_Minh',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Australia/Sydney',
] as const;

type SectionKey = 'identity' | 'workAvailability' | 'contact' | 'location' | 'socialLinks' | 'seoOg';

type BilingualGroup = FormGroup<{
  en: FormControl<string>;
  vi: FormControl<string>;
}>;

/** Snapshot kept before a section PATCH so we can roll back on failure. */
interface SectionSnapshot {
  value: { [key: string]: unknown };
}

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
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    FormErrorPipe,
    LongFormLayoutComponent,
    ScrollspyRailComponent,
    SectionCardComponent,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfilePageComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sidebarState = inject(SidebarState, { optional: true });

  private readonly sidebarWasOpen = signal<boolean | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────

  readonly loading = signal(false);
  readonly avatarUploading = signal(false);
  readonly ogImageUploading = signal(false);
  readonly avatarPreview = signal<string | null>(null);
  readonly ogImagePreview = signal<string | null>(null);
  readonly jsonLd = signal<unknown>(null);
  readonly showJsonLd = signal(false);

  readonly availabilityOptions = AVAILABILITY_OPTIONS;
  readonly openToOptions = OPEN_TO_OPTIONS;
  readonly socialPlatformOptions = SOCIAL_PLATFORM_OPTIONS;
  readonly timezoneOptions = TIMEZONE_OPTIONS;

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
      validators: [Validators.required, Validators.min(0), Validators.max(99)],
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
    resumeUrls: this.fb.group({
      en: this.fb.control('', { nonNullable: true }),
      vi: this.fb.control('', { nonNullable: true }),
    }),
    certifications: this.fb.array<FormGroup>([]),
  });

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
    if (this.sidebarState) {
      this.sidebarWasOpen.set(this.sidebarState.isOpen());
      this.sidebarState.setOpen(false);
    }
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

  // ── Form array accessors ─────────────────────────────────────────────────

  get socialLinksArray(): FormArray {
    return this.socialLinksForm.get('socialLinks') as FormArray;
  }

  get certificationsArray(): FormArray {
    return this.socialLinksForm.get('certifications') as FormArray;
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

    this.socialLinksArray.clear();
    for (const link of profile.socialLinks) {
      this.socialLinksArray.push(this.createSocialLinkGroup(link.platform, link.url, link.handle ?? ''));
    }
    this.certificationsArray.clear();
    for (const cert of profile.certifications) {
      this.certificationsArray.push(this.createCertificationGroup(cert.name, cert.issuer, cert.year, cert.url ?? ''));
    }
    this.socialLinksForm.get('resumeUrls')?.reset({
      en: profile.resumeUrls.en ?? '',
      vi: profile.resumeUrls.vi ?? '',
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
    this.socialLinksArray.push(this.createSocialLinkGroup());
    this.socialLinksArray.markAsDirty();
  }

  removeSocialLink(index: number): void {
    this.socialLinksArray.removeAt(index);
    this.socialLinksArray.markAsDirty();
  }

  addCertification(): void {
    this.certificationsArray.push(this.createCertificationGroup());
    this.certificationsArray.markAsDirty();
  }

  removeCertification(index: number): void {
    this.certificationsArray.removeAt(index);
    this.certificationsArray.markAsDirty();
  }

  // ── Open-To chip toggle ──────────────────────────────────────────────────

  toggleOpenTo(value: string): void {
    const ctrl = this.workAvailabilityForm.get('openTo');
    const current: string[] = ctrl?.value ?? [];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    ctrl?.setValue(updated);
    ctrl?.markAsDirty();
  }

  isOpenToSelected(value: string): boolean {
    return (this.workAvailabilityForm.get('openTo')?.value ?? []).includes(value);
  }

  // ── Per-section save handlers ────────────────────────────────────────────

  saveIdentity(): void {
    const v = this.identityForm.getRawValue();
    const payload: UpdateIdentityPayload = {
      fullName: v.fullName as TranslatableValue,
      title: v.title as TranslatableValue,
      bioShort: v.bioShort as TranslatableValue,
      bioLong: this.toOptionalTranslatable(v.bioLong as TranslatableValue),
    };
    this.runSectionSave('identity', this.identityForm, () => this.profileService.updateIdentity(payload));
  }

  saveWorkAvailability(): void {
    const v = this.workAvailabilityForm.getRawValue();
    const payload: UpdateWorkAvailabilityPayload = {
      yearsOfExperience: v.yearsOfExperience,
      availability: v.availability,
      openTo: v.openTo,
      timezone: v.timezone ? v.timezone : null,
    };
    this.runSectionSave('workAvailability', this.workAvailabilityForm, () =>
      this.profileService.updateWorkAvailability(payload)
    );
  }

  saveContact(): void {
    const v = this.contactForm.getRawValue();
    const payload: UpdateContactPayload = {
      email: v.email,
      phone: v.phone ? v.phone : null,
      preferredContactPlatform: v.preferredContactPlatform,
      preferredContactValue: v.preferredContactValue,
    };
    this.runSectionSave('contact', this.contactForm, () => this.profileService.updateContact(payload));
  }

  saveLocation(): void {
    const v = this.locationForm.getRawValue();
    const payload: UpdateLocationPayload = {
      locationCountry: v.locationCountry,
      locationCity: v.locationCity,
      locationPostalCode: v.locationPostalCode ? v.locationPostalCode : null,
      locationAddress1: v.locationAddress1 ? v.locationAddress1 : null,
      locationAddress2: v.locationAddress2 ? v.locationAddress2 : null,
    };
    this.runSectionSave('location', this.locationForm, () => this.profileService.updateLocation(payload));
  }

  saveSocialLinks(): void {
    const v = this.socialLinksForm.getRawValue();
    const payload: UpdateSocialLinksPayload = {
      socialLinks: (v.socialLinks as Array<{ platform: string; url: string; handle: string }>).map((l) => ({
        platform: l.platform,
        url: l.url,
        handle: l.handle || undefined,
      })),
      resumeUrls: {
        en: v.resumeUrls.en || undefined,
        vi: v.resumeUrls.vi || undefined,
      },
      certifications: (v.certifications as Array<{ name: string; issuer: string; year: number; url: string }>).map(
        (c) => ({
          name: c.name,
          issuer: c.issuer,
          year: c.year,
          url: c.url || undefined,
        })
      ),
    };
    this.runSectionSave('socialLinks', this.socialLinksForm, () => this.profileService.updateSocialLinks(payload));
  }

  saveSeoOg(): void {
    const v = this.seoOgForm.getRawValue();
    const payload: UpdateSeoOgPayload = {
      metaTitle: v.metaTitle ? v.metaTitle : null,
      metaDescription: v.metaDescription ? v.metaDescription : null,
      canonicalUrl: v.canonicalUrl ? v.canonicalUrl : null,
    };
    this.runSectionSave('seoOg', this.seoOgForm, () => this.profileService.updateSeoOg(payload));
  }

  // ── Save orchestration (optimistic update + rollback on error) ───────────

  private runSectionSave(key: SectionKey, form: FormGroup, call: () => Observable<void>): void {
    if (form.invalid) {
      form.markAllAsTouched();
      this.errors[key].set('Fix errors before saving');
      return;
    }

    // Snapshot for rollback — take the raw value BEFORE marking pristine.
    const snapshot: SectionSnapshot = { value: form.getRawValue() as { [key: string]: unknown } };
    this.saving[key].set(true);
    this.errors[key].set(null);
    // Optimistic: treat the form as pristine right away.
    form.markAsPristine();

    call()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving[key].set(false);
          this.lastSaved[key].set(new Date());
          this.toast.success(`${this.labelFor(key)} saved`);
        },
        error: (err) => {
          this.saving[key].set(false);
          // Roll back to the snapshot (re-marks form as dirty via patch).
          form.patchValue(snapshot.value);
          form.markAsDirty();
          const apiError = extractApiError(err);
          const message = apiError?.message ?? `Failed to save ${this.labelFor(key)}`;
          this.errors[key].set(message);
          this.toast.error(message);
        },
      });
  }

  private labelFor(key: SectionKey): string {
    switch (key) {
      case 'identity':
        return 'Identity';
      case 'workAvailability':
        return 'Work & Availability';
      case 'contact':
        return 'Contact';
      case 'location':
        return 'Location';
      case 'socialLinks':
        return 'Social Links';
      case 'seoOg':
        return 'SEO / OG';
    }
  }

  // ── Avatar / OG image (dedicated endpoints, save-on-upload) ──────────────

  onAvatarFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarUploading.set(true);
    this.profileService
      .uploadMedia(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (id) => {
          this.profileService
            .updateAvatar(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.avatarUploading.set(false);
                this.avatarId.set(id);
                this.avatarPreview.set(URL.createObjectURL(file));
                this.toast.success('Avatar updated');
              },
              error: () => {
                this.avatarUploading.set(false);
                this.toast.error('Avatar save failed');
              },
            });
        },
        error: () => {
          this.avatarUploading.set(false);
          this.toast.error('Avatar upload failed');
        },
      });
  }

  clearAvatar(): void {
    this.avatarUploading.set(true);
    this.profileService
      .updateAvatar(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.avatarUploading.set(false);
          this.avatarId.set(null);
          this.avatarPreview.set(null);
        },
        error: () => {
          this.avatarUploading.set(false);
          this.toast.error('Failed to remove avatar');
        },
      });
  }

  onOgImageFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.ogImageUploading.set(true);
    this.profileService
      .uploadMedia(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (id) => {
          this.profileService
            .updateOgImage(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                this.ogImageUploading.set(false);
                this.ogImageId.set(id);
                this.ogImagePreview.set(URL.createObjectURL(file));
                this.toast.success('OG image updated');
              },
              error: () => {
                this.ogImageUploading.set(false);
                this.toast.error('OG image save failed');
              },
            });
        },
        error: () => {
          this.ogImageUploading.set(false);
          this.toast.error('OG image upload failed');
        },
      });
  }

  clearOgImage(): void {
    this.ogImageUploading.set(true);
    this.profileService
      .updateOgImage(null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.ogImageUploading.set(false);
          this.ogImageId.set(null);
          this.ogImagePreview.set(null);
        },
        error: () => {
          this.ogImageUploading.set(false);
          this.toast.error('Failed to remove OG image');
        },
      });
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

  private bilingualGroup(opts: { required: boolean; maxLength?: number }): BilingualGroup {
    const validators = [];
    if (opts.required) validators.push(Validators.required);
    if (opts.maxLength !== undefined) validators.push(Validators.maxLength(opts.maxLength));
    return this.fb.group({
      en: this.fb.control('', { nonNullable: true, validators }),
      vi: this.fb.control('', { nonNullable: true, validators }),
    });
  }

  private toOptionalTranslatable(value: TranslatableValue): OptionalTranslatableValue | null {
    const en = value.en?.trim();
    const vi = value.vi?.trim();
    if (!en && !vi) return null;
    return {
      en: en || undefined,
      vi: vi || undefined,
    };
  }

  private wireFormStateSignal(key: SectionKey, fg: FormGroup): void {
    const sync = (): void => {
      this.dirty[key].set(fg.dirty);
      this.invalid[key].set(fg.invalid);
      // User resumed editing — clear the stale error banner.
      if (fg.dirty && this.errors[key]()) this.errors[key].set(null);
    };
    sync();
    fg.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => sync());
  }
}
