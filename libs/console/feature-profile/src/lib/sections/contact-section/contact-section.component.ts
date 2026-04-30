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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { startWith } from 'rxjs';
import { FormSnapshotDirective, SectionCardComponent, SectionStatus, ToastService } from '@portfolio/console/shared/ui';
import { baselineFor, FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { SOCIAL_PLATFORM_OPTIONS } from '../../profile.data';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';

@Component({
  selector: 'console-profile-contact-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SectionCardComponent,
    FormSnapshotDirective,
    ServerErrorDirective,
    FormErrorPipe,
  ],
  templateUrl: './contact-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly socialPlatformOptions = SOCIAL_PLATFORM_OPTIONS;

  readonly form = this.fb.group({
    email: this.fb.control('', { nonNullable: true, validators: [Validators.required, ...baselineFor.email()] }),
    preferredContactPlatform: this.fb.control<string>('GITHUB', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    preferredContactValue: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(LIMITS.URL_MAX)],
    }),
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
        email: data.email,
        preferredContactPlatform: data.preferredContactPlatform,
        preferredContactValue: data.preferredContactValue,
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
    const data = this.initialData();
    if (!data) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    // updateContact endpoint expects phone too — pull from last server-saved profile data.
    this.profileService
      .updateContact({ ...v, phone: data.phone ?? null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('Contact saved');
          this.saved.emit({
            email: v.email,
            preferredContactPlatform: v.preferredContactPlatform,
            preferredContactValue: v.preferredContactValue,
          });
        },
        error: () => this.saving.set(false),
      });
  }
}
