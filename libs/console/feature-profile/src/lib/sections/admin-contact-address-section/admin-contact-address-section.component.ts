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
import { forkJoin, startWith } from 'rxjs';
import { FormSnapshotDirective, SectionCardComponent, SectionStatus, ToastService } from '@portfolio/console/shared/ui';
import { baselineFor, FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { ProfileService } from '../../profile.service';
import { ProfileAdminResponse } from '../../profile.types';

@Component({
  selector: 'console-profile-admin-contact-address-section',
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
  templateUrl: './admin-contact-address-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminContactAddressSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly initialData = input.required<ProfileAdminResponse | null>();
  readonly saved = output<Partial<ProfileAdminResponse>>();

  readonly form = this.fb.group({
    phone: this.fb.control('', { nonNullable: true, validators: baselineFor.phone() }),
    locationPostalCode: this.fb.control('', { nonNullable: true, validators: baselineFor.postalCode() }),
    locationAddress1: this.fb.control('', { nonNullable: true, validators: baselineFor.address() }),
    locationAddress2: this.fb.control('', { nonNullable: true, validators: baselineFor.address() }),
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
        phone: data.phone ?? '',
        locationPostalCode: data.locationPostalCode ?? '',
        locationAddress1: data.locationAddress1 ?? '',
        locationAddress2: data.locationAddress2 ?? '',
      });
      this.hydrated = true;
    });
    this.form.events.pipe(startWith(null), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(this.form.dirty);
      this.invalid.set(this.form.invalid);
    });
  }

  /**
   * Persists admin-only contact + address fields. The BE has no combined endpoint, so we
   * fan out to `updateContact` (phone) and `updateLocation` (postal/address). Sibling
   * fields (email/platform/value, country/city) come from the last server-saved profile
   * via `initialData()` — this section never reads from sibling form components.
   */
  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data = this.initialData();
    if (!data) return;

    this.saving.set(true);
    const v = this.form.getRawValue();

    forkJoin([
      this.profileService.updateContact({
        email: data.email,
        preferredContactPlatform: data.preferredContactPlatform,
        preferredContactValue: data.preferredContactValue,
        phone: v.phone || null,
      }),
      this.profileService.updateLocation({
        locationCountry: data.locationCountry,
        locationCity: data.locationCity,
        locationPostalCode: v.locationPostalCode || null,
        locationAddress1: v.locationAddress1 || null,
        locationAddress2: v.locationAddress2 || null,
      }),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.form.markAsPristine();
          this.lastSaved.set(new Date());
          this.toast.success('Admin Contact & Address saved');
          this.saved.emit({
            phone: v.phone || null,
            locationPostalCode: v.locationPostalCode || null,
            locationAddress1: v.locationAddress1 || null,
            locationAddress2: v.locationAddress2 || null,
          });
        },
        error: () => this.saving.set(false),
      });
  }
}
