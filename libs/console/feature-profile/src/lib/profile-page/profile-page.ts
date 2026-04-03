import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JsonPipe } from '@angular/common';
import { extractApiError } from '@portfolio/console/shared/data-access';
import { SpinnerOverlayComponent, ToastService } from '@portfolio/console/shared/ui';
import { ProfileAdminResponse } from '../profile.types';
import { ProfileService } from '../profile.service';

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

type SocialLinkGroup = FormGroup<{
  platform: ReturnType<FormBuilder['control']>;
  url: ReturnType<FormBuilder['control']>;
  handle: ReturnType<FormBuilder['control']>;
}>;

type CertificationGroup = FormGroup<{
  name: ReturnType<FormBuilder['control']>;
  issuer: ReturnType<FormBuilder['control']>;
  year: ReturnType<FormBuilder['control']>;
  url: ReturnType<FormBuilder['control']>;
}>;

@Component({
  selector: 'console-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    JsonPipe,
    SpinnerOverlayComponent,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly saving = signal(false);
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

  readonly form = this.fb.group({
    // Identity
    fullName_en: ['', Validators.required],
    fullName_vi: ['', Validators.required],
    title_en: ['', Validators.required],
    title_vi: ['', Validators.required],
    bioShort_en: ['', [Validators.required, Validators.maxLength(200)]],
    bioShort_vi: ['', [Validators.required, Validators.maxLength(200)]],
    bioLong_en: [''],
    bioLong_vi: [''],
    avatarId: [''],

    // Work & Availability
    yearsOfExperience: [0, [Validators.required, Validators.min(0), Validators.max(99)]],
    availability: ['EMPLOYED', Validators.required],
    openTo: [[] as string[]],

    // Contact
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    preferredContactPlatform: ['GITHUB', Validators.required],
    preferredContactValue: ['', Validators.required],

    // Location
    locationCountry: ['', Validators.required],
    locationCity: ['', Validators.required],
    locationPostalCode: [''],
    locationAddress1: [''],
    locationAddress2: [''],

    // Resume
    resumeUrl_en: [''],
    resumeUrl_vi: [''],

    // SEO & Meta
    metaTitle: ['', Validators.maxLength(70)],
    metaDescription: ['', Validators.maxLength(160)],
    ogImageId: [''],
    canonicalUrl: [''],
    timezone: [''],

    // Dynamic arrays managed separately
    socialLinks: this.fb.array([] as SocialLinkGroup[]),
    certifications: this.fb.array([] as CertificationGroup[]),
  });

  get socialLinksArray(): FormArray {
    return this.form.get('socialLinks') as FormArray;
  }

  get certificationsArray(): FormArray {
    return this.form.get('certifications') as FormArray;
  }

  ngOnInit(): void {
    this.loadProfile();
  }

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
    this.form.patchValue({
      fullName_en: profile.fullName.en,
      fullName_vi: profile.fullName.vi,
      title_en: profile.title.en,
      title_vi: profile.title.vi,
      bioShort_en: profile.bioShort.en,
      bioShort_vi: profile.bioShort.vi,
      bioLong_en: profile.bioLong?.en ?? '',
      bioLong_vi: profile.bioLong?.vi ?? '',
      avatarId: profile.avatarId ?? '',
      yearsOfExperience: profile.yearsOfExperience,
      availability: profile.availability,
      openTo: profile.openTo,
      email: profile.email,
      phone: profile.phone ?? '',
      preferredContactPlatform: profile.preferredContactPlatform,
      preferredContactValue: profile.preferredContactValue,
      locationCountry: profile.locationCountry,
      locationCity: profile.locationCity,
      locationPostalCode: profile.locationPostalCode ?? '',
      locationAddress1: profile.locationAddress1 ?? '',
      locationAddress2: profile.locationAddress2 ?? '',
      resumeUrl_en: profile.resumeUrls.en ?? '',
      resumeUrl_vi: profile.resumeUrls.vi ?? '',
      metaTitle: profile.metaTitle ?? '',
      metaDescription: profile.metaDescription ?? '',
      ogImageId: profile.ogImageId ?? '',
      canonicalUrl: profile.canonicalUrl ?? '',
      timezone: profile.timezone ?? '',
    });

    this.avatarPreview.set(profile.avatarUrl);
    this.ogImagePreview.set(profile.ogImageUrl);

    // Populate social links
    this.socialLinksArray.clear();
    for (const link of profile.socialLinks) {
      this.socialLinksArray.push(this.createSocialLinkGroup(link.platform, link.url, link.handle));
    }

    // Populate certifications
    this.certificationsArray.clear();
    for (const cert of profile.certifications) {
      this.certificationsArray.push(this.createCertificationGroup(cert.name, cert.issuer, cert.year, cert.url));
    }
  }

  private createSocialLinkGroup(platform = 'GITHUB', url = '', handle = ''): SocialLinkGroup {
    return this.fb.group({
      platform: [platform, Validators.required],
      url: [url, [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      handle: [handle],
    }) as SocialLinkGroup;
  }

  private createCertificationGroup(
    name = '',
    issuer = '',
    year = new Date().getFullYear(),
    url = ''
  ): CertificationGroup {
    return this.fb.group({
      name: [name, Validators.required],
      issuer: [issuer, Validators.required],
      year: [year, [Validators.required, Validators.min(1990), Validators.max(2100)]],
      url: [url],
    }) as CertificationGroup;
  }

  addSocialLink(): void {
    this.socialLinksArray.push(this.createSocialLinkGroup());
  }

  removeSocialLink(index: number): void {
    this.socialLinksArray.removeAt(index);
  }

  addCertification(): void {
    this.certificationsArray.push(this.createCertificationGroup());
  }

  removeCertification(index: number): void {
    this.certificationsArray.removeAt(index);
  }

  toggleOpenTo(value: string): void {
    const current: string[] = this.form.get('openTo')?.value ?? [];
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.form.get('openTo')?.setValue(updated);
  }

  isOpenToSelected(value: string): boolean {
    return (this.form.get('openTo')?.value ?? []).includes(value);
  }

  onAvatarFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarUploading.set(true);
    this.profileService
      .uploadMedia(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (id) => {
          this.avatarUploading.set(false);
          this.form.get('avatarId')?.setValue(id);
          this.avatarPreview.set(URL.createObjectURL(file));
        },
        error: () => {
          this.avatarUploading.set(false);
          this.toast.error('Avatar upload failed');
        },
      });
  }

  clearAvatar(): void {
    this.form.get('avatarId')?.setValue('');
    this.avatarPreview.set(null);
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
          this.ogImageUploading.set(false);
          this.form.get('ogImageId')?.setValue(id);
          this.ogImagePreview.set(URL.createObjectURL(file));
        },
        error: () => {
          this.ogImageUploading.set(false);
          this.toast.error('OG image upload failed');
        },
      });
  }

  clearOgImage(): void {
    this.form.get('ogImageId')?.setValue('');
    this.ogImagePreview.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      fullName: { en: v.fullName_en ?? '', vi: v.fullName_vi ?? '' },
      title: { en: v.title_en ?? '', vi: v.title_vi ?? '' },
      bioShort: { en: v.bioShort_en ?? '', vi: v.bioShort_vi ?? '' },
      bioLong: { en: v.bioLong_en ?? '', vi: v.bioLong_vi ?? '' },
      yearsOfExperience: v.yearsOfExperience ?? 0,
      availability: v.availability ?? 'EMPLOYED',
      openTo: v.openTo ?? [],
      email: v.email ?? '',
      phone: v.phone ?? undefined,
      preferredContactPlatform: v.preferredContactPlatform ?? 'GITHUB',
      preferredContactValue: v.preferredContactValue ?? '',
      locationCountry: v.locationCountry ?? '',
      locationCity: v.locationCity ?? '',
      locationPostalCode: v.locationPostalCode ?? undefined,
      locationAddress1: v.locationAddress1 ?? undefined,
      locationAddress2: v.locationAddress2 ?? undefined,
      socialLinks: (v.socialLinks as Array<{ platform: string; url: string; handle: string }>).map((l) => ({
        platform: l.platform,
        url: l.url,
        handle: l.handle || undefined,
      })),
      resumeUrls: {
        en: v.resumeUrl_en || undefined,
        vi: v.resumeUrl_vi || undefined,
      },
      certifications: (v.certifications as Array<{ name: string; issuer: string; year: number; url: string }>).map(
        (c) => ({
          name: c.name,
          issuer: c.issuer,
          year: c.year,
          url: c.url || undefined,
        })
      ),
      metaTitle: v.metaTitle || undefined,
      metaDescription: v.metaDescription || undefined,
      ogImageId: v.ogImageId || undefined,
      canonicalUrl: v.canonicalUrl || undefined,
      timezone: v.timezone || undefined,
      avatarId: v.avatarId || undefined,
    };

    this.saving.set(true);
    this.profileService
      .upsert(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Profile saved');
        },
        error: (err) => {
          this.saving.set(false);
          const apiError = extractApiError(err);
          this.toast.error(apiError?.message ?? 'Failed to save profile');
        },
      });
  }

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

  asSocialLinkGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  asCertificationGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }
}
