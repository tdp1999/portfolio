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
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { startWith } from 'rxjs';
import {
  SectionCard,
  SectionStatus,
  StickySaveBar,
  ToastService,
  TranslatableMarkdownGroup,
} from '@portfolio/console/shared/ui';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';
import { isEmpty } from './profile-landing-content.section.util';

/** Landing copy is one atomic BE block (`updateLandingContent` full-replace), so the
 *  three sub-tabs share a single form and a single save. `activeSubTab` — driven by
 *  the profile page's rail (`section-landing-home` | `-footer` | `-about`) — decides
 *  which sub-card is shown; the sticky save bar commits the whole block regardless of
 *  which sub-tab is open. */
@Component({
  selector: 'console-profile-landing-content-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    SectionCard,
    StickySaveBar,
    TranslatableMarkdownGroup,
  ],
  templateUrl: './profile-landing-content.section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileLandingContentSection {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  /** Which landing sub-tab the profile rail currently has active. */
  readonly activeSubTab = input<string>('section-landing-home');
  /** When the shell is in "show all" mode, render every sub-card at once. */
  readonly showAll = input<boolean>(false);
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly form = this.fb.group({
    tagline: this.bilingualGroup(),
    stackIntro: this.bilingualGroup(),
    selectedWorkIntro: this.bilingualGroup(),
    contactIntro: this.bilingualGroup(),
    footerTagline: this.bilingualGroup(),
    aboutHeading: this.bilingualGroup(),
    aboutLede: this.bilingualGroup(),
    ctaHeading: this.bilingualGroup(),
    ctaLede: this.bilingualGroup(),
    coreStack: this.fb.control('', { nonNullable: true }),
  });

  readonly saving = signal(false);
  readonly lastSaved = signal<Date | null>(null);
  /** Mirrored from `Profile.contentUpdatedAt` — distinct from `lastSaved`
   *  (which only reflects this session). Drives the /about hero "Last
   *  updated" line and the muted timestamp next to the Mark-updated button. */
  readonly contentUpdatedAt = signal<Date | null>(null);
  readonly markingUpdated = signal(false);
  // Public so the shared sticky save bar can bind to it.
  readonly dirty = signal(false);
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
      this.form.reset(this.mapToForm(data));
      this.contentUpdatedAt.set(data.contentUpdatedAt ? new Date(data.contentUpdatedAt) : null);
      this.hydrated = true;
    });
    this.form.events.pipe(startWith(null), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(this.form.dirty);
      this.invalid.set(this.form.invalid);
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const coreStack = v.coreStack
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const payload = {
      tagline: isEmpty(v.tagline) ? null : v.tagline,
      stackIntro: isEmpty(v.stackIntro) ? null : v.stackIntro,
      selectedWorkIntro: isEmpty(v.selectedWorkIntro) ? null : v.selectedWorkIntro,
      contactIntro: isEmpty(v.contactIntro) ? null : v.contactIntro,
      footerTagline: isEmpty(v.footerTagline) ? null : v.footerTagline,
      aboutHeading: isEmpty(v.aboutHeading) ? null : v.aboutHeading,
      aboutLede: isEmpty(v.aboutLede) ? null : v.aboutLede,
      ctaHeading: isEmpty(v.ctaHeading) ? null : v.ctaHeading,
      ctaLede: isEmpty(v.ctaLede) ? null : v.ctaLede,
      coreStack,
    };
    this.profileService
      .updateLandingContent(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.dirty.set(false);
          this.lastSaved.set(new Date());
          this.toast.success('Landing content saved');
          this.saved.emit(payload);
        },
        error: () => this.saving.set(false),
      });
  }

  /** Reverts every landing sub-tab back to the last-loaded/saved values. */
  discard(): void {
    const data = this.initialData();
    if (data) this.form.reset(this.mapToForm(data));
    this.form.markAsPristine();
    this.dirty.set(false);
  }

  /** Stamp `Profile.contentUpdatedAt = now()` on the BE — author confirms
   *  the published /about copy is current. Independent of the per-save dirty
   *  flow above so the timestamp tracks narrative cadence, not every field
   *  tweak. */
  markUpdatedNow(): void {
    if (this.markingUpdated()) return;
    this.markingUpdated.set(true);
    this.profileService
      .markContentUpdated()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.markingUpdated.set(false);
          this.contentUpdatedAt.set(new Date(res.contentUpdatedAt));
          this.toast.success('Marked content as updated');
        },
        error: () => this.markingUpdated.set(false),
      });
  }

  private mapToForm(data: ProfileAdminResponse) {
    return {
      tagline: { en: data.tagline?.en ?? '', vi: data.tagline?.vi ?? '' },
      stackIntro: { en: data.stackIntro?.en ?? '', vi: data.stackIntro?.vi ?? '' },
      selectedWorkIntro: {
        en: data.selectedWorkIntro?.en ?? '',
        vi: data.selectedWorkIntro?.vi ?? '',
      },
      contactIntro: { en: data.contactIntro?.en ?? '', vi: data.contactIntro?.vi ?? '' },
      footerTagline: { en: data.footerTagline?.en ?? '', vi: data.footerTagline?.vi ?? '' },
      aboutHeading: { en: data.aboutHeading?.en ?? '', vi: data.aboutHeading?.vi ?? '' },
      aboutLede: { en: data.aboutLede?.en ?? '', vi: data.aboutLede?.vi ?? '' },
      ctaHeading: { en: data.ctaHeading?.en ?? '', vi: data.ctaHeading?.vi ?? '' },
      ctaLede: { en: data.ctaLede?.en ?? '', vi: data.ctaLede?.vi ?? '' },
      coreStack: (data.coreStack ?? []).join(', '),
    };
  }

  private bilingualGroup() {
    return this.fb.group({
      en: this.fb.control('', { nonNullable: true }),
      vi: this.fb.control('', { nonNullable: true }),
    });
  }
}
