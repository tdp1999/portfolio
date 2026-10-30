import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router } from '@angular/router';
import {
  askUnsavedChanges,
  type HasUnsavedChanges,
  onBeforeUnload,
  SpinnerOverlay,
  ToastService,
} from '@portfolio/console/shared/ui';
import {
  type ErrorMessage,
  FormErrorPipe,
  scrollToFirstError,
  ServerErrorDirective,
} from '@portfolio/console/shared/util';
import {
  MEDICAL_ITEM_KIND_LABELS,
  MEDICINE_TIMING_LABELS,
  MEDICINE_USAGE_TYPE_LABELS,
} from '@portfolio/shared/enum-labels';
import {
  MEDICAL_ITEM_KINDS,
  MEDICINE_TIMINGS,
  MEDICINE_USAGE_TYPES,
  type MedicalItemKind,
  type MedicineTiming,
  type MedicineUsageType,
} from '@portfolio/shared/types';
import { LIMITS } from '@portfolio/shared/validation';
import { Observable } from 'rxjs';
import HealthProfileNameDialog, {
  type HealthProfileNameDialogData,
  type HealthProfileNameDialogResult,
} from '../health-profile.name-dialog/health-profile.name-dialog';
import { MedicineCabinetService } from '../medicine-cabinet.service';
import { EXTERNAL_NAVIGATE, LANDING_URL } from '../medicine-cabinet.tokens';
import type { HealthProfileDto, MedicalItemDto } from '../medicine-cabinet.types';
import { fieldMessages, maxText, requiredText } from '../medicine-cabinet.validator';
import { safeReturnTo } from '../return-to.util';
import { ADD_PERSON, ingredientsValidator, MEDICINE_ONLY_FIELDS, toMedicalItemPayload } from './medical-item.form.util';

const LIST_URL = '/medicine-cabinet';

/** 'S2 Form sản phẩm': creates an item at `new`, edits one at `:id/edit`. `?returnTo=` leads back to S6 (R16). */
@Component({
  selector: 'console-medical-item-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    SpinnerOverlay,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './medical-item.form.html',
  styleUrl: './medical-item.form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MedicalItemForm implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MedicineCabinetService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly navigateOut = inject(EXTERNAL_NAVIGATE);
  private readonly landingUrl = inject(LANDING_URL);

  protected readonly addPerson = ADD_PERSON;
  protected readonly kinds = MEDICAL_ITEM_KINDS;
  protected readonly timings = MEDICINE_TIMINGS;
  protected readonly usageTypes = MEDICINE_USAGE_TYPES;
  protected readonly kindLabels = MEDICAL_ITEM_KIND_LABELS;
  protected readonly timingLabels = MEDICINE_TIMING_LABELS;
  protected readonly usageTypeLabels = MEDICINE_USAGE_TYPE_LABELS;
  protected readonly messages = {
    profileId: fieldMessages('Person'),
    name: fieldMessages('Name'),
    strength: fieldMessages('Strength'),
    text: fieldMessages('This field'),
    activeIngredients: {
      ingredientsMax: (p) => `Maximum ${p['max']} active ingredients`,
      ingredientMaxLength: (p) => `Maximum ${p['max']} characters`,
    } satisfies Record<string, ErrorMessage>,
  };

  protected readonly id = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.id() !== null);
  protected readonly people = signal<HealthProfileDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  /** The item was deleted elsewhere (R13.4, R13.10): the form gives way to a message. */
  protected readonly missing = signal(false);
  protected readonly kind = signal<MedicalItemKind>('MEDICINE');
  private readonly dirty = signal(false);
  /** The person chosen before "+ Add new person". */
  private previousPerson = '';
  private readonly returnTo = safeReturnTo(this.route.snapshot.queryParamMap.get('returnTo'), this.landingUrl);

  protected readonly form = this.fb.nonNullable.group({
    profileId: ['', requiredText()],
    kind: this.fb.nonNullable.control<MedicalItemKind>('MEDICINE'),
    name: ['', [requiredText(), maxText(LIMITS.MEDICAL_ITEM_NAME_MAX)]],
    activeIngredients: this.fb.nonNullable.control<string[]>([], ingredientsValidator()),
    strength: ['', [requiredText(), maxText(LIMITS.MEDICINE_STRENGTH_MAX)]],
    dose: ['', maxText(LIMITS.MEDICINE_DOSE_MAX)],
    timing: this.fb.control<MedicineTiming | null>(null),
    usageType: this.fb.control<MedicineUsageType | null>(null),
    purpose: ['', maxText(LIMITS.MEDICINE_PURPOSE_MAX)],
    note: ['', maxText(LIMITS.MEDICAL_ITEM_NOTE_MAX)],
    packForTravel: false,
  });

  ngOnInit(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.dirty.set(true));
    // P8: a supply has no medicine inputs, and going back to medicine starts them empty.
    this.form.controls.kind.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((kind) => {
      this.kind.set(kind);
      this.applyKind(kind, { reset: true });
    });

    this.loadPeople();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.form.controls.kind.disable({ emitEvent: false });
      this.load(id);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    onBeforeUnload(event, this.dirty());
  }

  hasUnsavedChanges() {
    return this.dirty;
  }

  onSaveAndContinue(): Promise<boolean> {
    return new Promise((resolve) => {
      const request = this.save();
      if (!request) return resolve(false);
      request.subscribe({ next: () => resolve(true), error: () => resolve(false) });
    });
  }

  /** "+ Add new person" opens S10; the Person input keeps its previous value until a person is saved (R11.4, R11.9). */
  protected onPersonChange(event: MatSelectChange): void {
    if (event.value !== ADD_PERSON) {
      this.previousPerson = event.value;
      return;
    }
    // No event: putting the old value back is not a change, so Cancel does not ask (R11.9).
    this.form.controls.profileId.setValue(this.previousPerson, { emitEvent: false });
    this.dialog
      .open<HealthProfileNameDialog, HealthProfileNameDialogData, HealthProfileNameDialogResult>(
        HealthProfileNameDialog,
        { data: { mode: 'add' }, width: '480px', maxWidth: '100vw' }
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result || result === 'missing') return;
        this.loadPeople(() => {
          this.previousPerson = result.id;
          this.form.controls.profileId.setValue(result.id);
        });
      });
  }

  protected addIngredient(event: MatChipInputEvent): void {
    const value = event.value.trim();
    if (value) this.setIngredients([...this.form.controls.activeIngredients.value, value]);
    event.chipInput.clear();
  }

  protected removeIngredient(index: number): void {
    this.setIngredients(this.form.controls.activeIngredients.value.filter((_, i) => i !== index));
  }

  protected submit(): void {
    // Errors already show: a 404 as the missing state, the rest through the global handler.
    this.save()?.subscribe({ next: () => this.leave(), error: () => undefined });
  }

  protected cancel(): void {
    if (!this.returnTo) {
      this.router.navigateByUrl(LIST_URL);
      return;
    }
    if (!this.dirty()) {
      this.navigateOut(this.returnTo);
      return;
    }
    askUnsavedChanges(this.dialog, true).then((choice) => {
      if (choice === 'discard') {
        this.dirty.set(false);
        this.leave();
      } else if (choice === 'save') {
        this.submit();
      }
    });
  }

  /** Back to S6 when a valid `returnTo` came with the link, otherwise to S1 (R16.3, R16.9). */
  protected leave(): void {
    if (this.returnTo) this.navigateOut(this.returnTo);
    else this.router.navigateByUrl(LIST_URL);
  }

  /** Sends the form; `null` when it is invalid or already sending. The returned stream is shared by its callers. */
  private save(): Observable<unknown> | null {
    if (this.submitting()) return null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      scrollToFirstError();
      return null;
    }
    this.submitting.set(true);
    const payload = toMedicalItemPayload(this.form.value);
    const id = this.id();
    const request: Observable<unknown> = id ? this.service.updateItem(id, payload) : this.service.createItem(payload);

    return new Observable<unknown>((subscriber) =>
      request.subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.dirty.set(false);
          this.toast.success('Item saved');
          subscriber.next(res);
          subscriber.complete();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          if (err.status === 404) this.showMissing();
          subscriber.error(err);
        },
      })
    );
  }

  private applyKind(kind: MedicalItemKind, opts: { reset: boolean }): void {
    for (const field of MEDICINE_ONLY_FIELDS) {
      const control = this.form.controls[field];
      if (opts.reset) control.reset(undefined, { emitEvent: false });
      if (kind === 'SUPPLY') control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
  }

  private setIngredients(values: string[]): void {
    const control = this.form.controls.activeIngredients;
    control.setValue(values);
    control.markAsDirty();
    control.markAsTouched();
  }

  private showMissing(): void {
    this.missing.set(true);
    this.dirty.set(false);
  }

  private loadPeople(then?: () => void): void {
    this.service.listProfiles().subscribe({
      next: (people) => {
        this.people.set(people);
        then?.();
      },
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.service.getItem(id).subscribe({
      next: (item) => {
        this.patch(item);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) this.showMissing();
      },
    });
  }

  private patch(item: MedicalItemDto): void {
    this.kind.set(item.kind);
    this.form.controls.kind.setValue(item.kind, { emitEvent: false });
    this.applyKind(item.kind, { reset: false });
    this.form.patchValue({
      profileId: item.profileId,
      name: item.name,
      activeIngredients: item.activeIngredients,
      strength: item.strength ?? '',
      dose: item.dose ?? '',
      timing: item.timing,
      usageType: item.usageType,
      purpose: item.purpose ?? '',
      note: item.note ?? '',
      packForTravel: item.packForTravel,
    });
    this.previousPerson = item.profileId;
    this.dirty.set(false);
  }
}
