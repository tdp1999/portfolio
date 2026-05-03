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
import { startWith } from 'rxjs';
import {
  FormSnapshotDirective,
  SectionCardComponent,
  SectionStatus,
  ToastService,
  TranslatableMarkdownGroupComponent,
} from '@portfolio/console/shared/ui';
import { ServerErrorDirective } from '@portfolio/console/shared/util';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';

function isEmpty(t: { en: string; vi: string }): boolean {
  return !t.en.trim() && !t.vi.trim();
}

@Component({
  selector: 'console-profile-landing-content-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SectionCardComponent,
    FormSnapshotDirective,
    ServerErrorDirective,
    TranslatableMarkdownGroupComponent,
  ],
  templateUrl: './landing-content-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingContentSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly form = this.fb.group({
    tagline: this.bilingualGroup(),
    stackIntro: this.bilingualGroup(),
    contactIntro: this.bilingualGroup(),
    footerTagline: this.bilingualGroup(),
  });

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
      this.form.reset({
        tagline: { en: data.tagline?.en ?? '', vi: data.tagline?.vi ?? '' },
        stackIntro: { en: data.stackIntro?.en ?? '', vi: data.stackIntro?.vi ?? '' },
        contactIntro: { en: data.contactIntro?.en ?? '', vi: data.contactIntro?.vi ?? '' },
        footerTagline: { en: data.footerTagline?.en ?? '', vi: data.footerTagline?.vi ?? '' },
      });
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
    const payload = {
      tagline: isEmpty(v.tagline) ? null : v.tagline,
      stackIntro: isEmpty(v.stackIntro) ? null : v.stackIntro,
      contactIntro: isEmpty(v.contactIntro) ? null : v.contactIntro,
      footerTagline: isEmpty(v.footerTagline) ? null : v.footerTagline,
    };
    this.profileService
      .updateLandingContent(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('Landing content saved');
          this.saved.emit(payload);
        },
        error: () => this.saving.set(false),
      });
  }

  private bilingualGroup() {
    return this.fb.group({
      en: this.fb.control('', { nonNullable: true }),
      vi: this.fb.control('', { nonNullable: true }),
    });
  }
}
