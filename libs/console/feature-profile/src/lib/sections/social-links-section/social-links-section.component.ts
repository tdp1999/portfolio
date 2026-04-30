import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { startWith } from 'rxjs';
import {
  ChipSelectComponent,
  type ChipSelectOption,
  FormSnapshotDirective,
  MediaPickerDataSource,
  MediaPickerDialogComponent,
  MediaPickerDialogData,
  SectionCardComponent,
  SectionStatus,
  ToastService,
} from '@portfolio/console/shared/ui';
import { baselineFor, FormErrorPipe, ServerErrorDirective, type MediaItem } from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { SOCIAL_PLATFORM_OPTIONS } from '../../profile.data';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse, UpdateSocialLinksPayload } from '../../profile.types';

@Component({
  selector: 'console-profile-social-links-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    SectionCardComponent,
    FormSnapshotDirective,
    ServerErrorDirective,
    FormErrorPipe,
    ChipSelectComponent,
  ],
  templateUrl: './social-links-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLinksSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly mediaDataSource = input.required<MediaPickerDataSource>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly socialPlatformOptions = SOCIAL_PLATFORM_OPTIONS;
  readonly resumeLocales: { key: 'en' | 'vi'; label: string }[] = [
    { key: 'en', label: 'EN' },
    { key: 'vi', label: 'VI' },
  ];
  readonly certModeOptions: ChipSelectOption[] = [
    { value: 'link', label: 'Link' },
    { value: 'file', label: 'File' },
  ];

  readonly form = this.fb.group({
    socialLinks: this.fb.array<FormGroup>([], { validators: Validators.maxLength(LIMITS.SOCIAL_LINKS_ARRAY_MAX) }),
    resumeUrls: this.fb.group({
      en: this.fb.control('', { nonNullable: true, validators: baselineFor.url() }),
      vi: this.fb.control('', { nonNullable: true, validators: baselineFor.url() }),
    }),
    certifications: this.fb.array<FormGroup>([], {
      validators: Validators.maxLength(LIMITS.CERTIFICATIONS_ARRAY_MAX),
    }),
  });

  readonly resumeNames = signal<{ en: string | null; vi: string | null }>({ en: null, vi: null });

  readonly saving = signal(false);
  readonly lastSaved = signal<Date | null>(null);
  private readonly dirty = signal(false);
  private readonly invalid = signal(false);

  readonly status = computed<SectionStatus>(() => {
    if (this.invalid()) return 'error';
    if (this.saving() || this.dirty()) return 'editing';
    if (this.lastSaved()) return 'saved';
    return 'untouched';
  });

  private hydrated = false;

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (!data || this.hydrated) return;
      this.hydrate(data);
      this.hydrated = true;
    });
    this.form.events.pipe(startWith(null), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(this.form.dirty);
      this.invalid.set(this.form.invalid);
    });
  }

  private hydrate(data: ProfileAdminResponse): void {
    this.form.controls.socialLinks.clear();
    for (const link of data.socialLinks) {
      this.form.controls.socialLinks.push(this.createSocialLinkGroup(link.platform, link.url, link.handle ?? ''));
    }
    this.form.controls.certifications.clear();
    for (const cert of data.certifications) {
      this.form.controls.certifications.push(
        this.createCertificationGroup(cert.name, cert.issuer, cert.year, cert.url ?? '')
      );
    }
    this.form.controls.resumeUrls.reset({
      en: data.resumeUrls.en?.url ?? '',
      vi: data.resumeUrls.vi?.url ?? '',
    });
    this.resumeNames.set({
      en: data.resumeUrls.en?.name ?? null,
      vi: data.resumeUrls.vi?.name ?? null,
    });
    this.form.markAsPristine();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
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
      certifications: (
        v.certifications as Array<{ name: string; issuer: string; year: number; url: string; mode: 'link' | 'file' }>
      ).map(({ mode: _mode, ...c }) => ({ ...c, url: c.url || undefined })),
    };
    this.profileService
      .updateSocialLinks(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('Social Links saved');
          this.saved.emit({});
        },
        error: () => this.saving.set(false),
      });
  }

  // ── FormArray helpers ──────────────────────────────────────────────────

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  addSocialLink(): void {
    this.form.controls.socialLinks.push(this.createSocialLinkGroup());
    this.form.controls.socialLinks.markAsDirty();
  }

  removeSocialLink(index: number): void {
    this.form.controls.socialLinks.removeAt(index);
    this.form.controls.socialLinks.markAsDirty();
  }

  addCertification(): void {
    this.form.controls.certifications.push(this.createCertificationGroup());
    this.form.controls.certifications.markAsDirty();
  }

  removeCertification(index: number): void {
    this.form.controls.certifications.removeAt(index);
    this.form.controls.certifications.markAsDirty();
  }

  openResumePicker(locale: 'en' | 'vi'): void {
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, MediaItem | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'application/pdf',
          defaultFolder: 'resumes',
          dataSource: this.mediaDataSource(),
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((item) => {
        if (!item) return;
        this.form.controls.resumeUrls.controls[locale].setValue(item.url);
        this.form.controls.resumeUrls.markAsDirty();
        this.resumeNames.update((n) => ({ ...n, [locale]: item.originalFilename }));
      });
  }

  clearResumeUrl(locale: 'en' | 'vi'): void {
    this.form.controls.resumeUrls.controls[locale].setValue('');
    this.form.controls.resumeUrls.markAsDirty();
    this.resumeNames.update((n) => ({ ...n, [locale]: null }));
  }

  openCertPicker(index: number): void {
    const certsArray = this.form.controls.certifications;
    const certGroup = certsArray.at(index) as FormGroup;
    this.dialog
      .open<MediaPickerDialogComponent, MediaPickerDialogData, MediaItem | undefined>(MediaPickerDialogComponent, {
        data: {
          mode: 'single',
          mimeFilter: 'application/pdf',
          defaultFolder: 'general',
          dataSource: this.mediaDataSource(),
        } satisfies MediaPickerDialogData,
        width: '900px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
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
   * FormSnapshotDirective rebuild callback. Required because `FormGroup.reset()` can't grow
   * FormArrays that shrank; this re-pushes groups using the same factories as initial load.
   */
  readonly rebuildSnapshot = (snap: unknown): void => {
    const s = snap as {
      socialLinks: Array<{ platform: string; url: string; handle: string }>;
      certifications: Array<{ name: string; issuer: string; year: number; url: string }>;
      resumeUrls: { en: string; vi: string };
    };
    const links = this.form.controls.socialLinks;
    const certs = this.form.controls.certifications;
    links.clear();
    for (const l of s.socialLinks) links.push(this.createSocialLinkGroup(l.platform, l.url, l.handle));
    certs.clear();
    for (const c of s.certifications) certs.push(this.createCertificationGroup(c.name, c.issuer, c.year, c.url));
    this.form.controls.resumeUrls.reset(s.resumeUrls);
  };

  private createSocialLinkGroup(platform = 'GITHUB', url = '', handle = ''): FormGroup {
    return this.fb.group({
      platform: this.fb.control(platform, { nonNullable: true, validators: [Validators.required] }),
      url: this.fb.control(url, { nonNullable: true, validators: [Validators.required, ...baselineFor.url()] }),
      handle: this.fb.control(handle, { nonNullable: true }),
    });
  }

  private createCertificationGroup(name = '', issuer = '', year = new Date().getFullYear(), url = ''): FormGroup {
    return this.fb.group({
      name: this.fb.control(name, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(LIMITS.NAME_MAX)],
      }),
      issuer: this.fb.control(issuer, {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(LIMITS.NAME_MAX)],
      }),
      year: this.fb.control(year, {
        nonNullable: true,
        validators: [Validators.required, ...baselineFor.certificationYear()],
      }),
      url: this.fb.control(url, { nonNullable: true, validators: baselineFor.url() }),
      mode: this.fb.control<'link' | 'file'>(this.inferCertMode(url), { nonNullable: true }),
    });
  }

  private inferCertMode(url: string): 'file' | 'link' {
    return url.includes('res.cloudinary.com') ? 'file' : 'link';
  }
}
