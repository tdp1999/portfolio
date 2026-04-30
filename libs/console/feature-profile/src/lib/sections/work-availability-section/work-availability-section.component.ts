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
import {
  ChipToggleGroupComponent,
  FormSnapshotDirective,
  SectionCardComponent,
  SectionStatus,
  ToastService,
} from '@portfolio/console/shared/ui';
import { baselineFor, FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { AVAILABILITY_OPTIONS, OPEN_TO_OPTIONS, TIMEZONE_OPTIONS } from '../../profile.data';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';

@Component({
  selector: 'console-profile-work-availability-section',
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
    ChipToggleGroupComponent,
  ],
  templateUrl: './work-availability-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkAvailabilitySectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly availabilityOptions = AVAILABILITY_OPTIONS;
  readonly openToOptions = OPEN_TO_OPTIONS;
  readonly timezoneOptions = TIMEZONE_OPTIONS;

  readonly form = this.fb.group({
    yearsOfExperience: this.fb.control(0, {
      nonNullable: true,
      validators: [Validators.required, ...baselineFor.yearsOfExperience()],
    }),
    availability: this.fb.control<string>('EMPLOYED', { nonNullable: true, validators: [Validators.required] }),
    openTo: this.fb.control<string[]>([], { nonNullable: true }),
    timezone: this.fb.control<string>('', { nonNullable: true }),
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
        yearsOfExperience: data.yearsOfExperience,
        availability: data.availability,
        openTo: data.openTo,
        timezone: data.timezone ?? '',
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
    this.profileService
      .updateWorkAvailability({ ...v, timezone: v.timezone || null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('Work & Availability saved');
          this.saved.emit({
            yearsOfExperience: v.yearsOfExperience,
            availability: v.availability,
            openTo: v.openTo,
            timezone: v.timezone || null,
          });
        },
        error: () => this.saving.set(false),
      });
  }
}
