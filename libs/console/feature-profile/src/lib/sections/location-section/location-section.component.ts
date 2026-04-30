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
import { startWith } from 'rxjs';
import { FormSnapshotDirective, SectionCardComponent, SectionStatus, ToastService } from '@portfolio/console/shared/ui';
import { FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';

@Component({
  selector: 'console-profile-location-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    SectionCardComponent,
    FormSnapshotDirective,
    ServerErrorDirective,
    FormErrorPipe,
  ],
  templateUrl: './location-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly form = this.fb.group({
    locationCountry: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(LIMITS.NAME_MAX)],
    }),
    locationCity: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(LIMITS.NAME_MAX)],
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
        locationCountry: data.locationCountry,
        locationCity: data.locationCity,
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
    // updateLocation endpoint expects postal/address too — pull from last server-saved profile data.
    this.profileService
      .updateLocation({
        ...v,
        locationPostalCode: data.locationPostalCode ?? null,
        locationAddress1: data.locationAddress1 ?? null,
        locationAddress2: data.locationAddress2 ?? null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('Location saved');
          this.saved.emit({ locationCountry: v.locationCountry, locationCity: v.locationCity });
        },
        error: () => this.saving.set(false),
      });
  }
}
