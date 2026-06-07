import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Checkbox,
  Container,
  FormField,
  Input,
  Link,
  Radio,
  RadioGroup,
  Section,
  Textarea,
} from '@portfolio/landing/shared/ui';

/**
 * `/ddl/form-lib` — live showcase of the landing form primitives shipped in
 * C21 (input · textarea · checkbox · radio · form-field). Acts as the single
 * visual QA page + a working reactive-form playground.
 *
 * The form below is wired to a real `FormGroup`; toggling `Show errors`
 * surfaces validators so the hint/error meta-row priority is observable
 * (hint right when valid, error left when invalid — error wins on both).
 */
@Component({
  selector: 'landing-ddl-form-lib',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Container, Section, Input, Textarea, Checkbox, FormField, RadioGroup, Radio, Link],
  templateUrl: './ddl-form-lib.html',
  styleUrl: './ddl-form-lib.scss',
})
export class DdlFormLib {
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly form = this.fb.group({
    name: this.fb.control('', { validators: [Validators.required, Validators.maxLength(60)] }),
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    message: this.fb.control('', { validators: [Validators.required, Validators.minLength(10)] }),
    audience: this.fb.control('recruiter', { validators: [Validators.required] }),
    consent: this.fb.control(false, { validators: [Validators.requiredTrue] }),
  });

  /** Bridges every form-control event (value, status, touched, dirty, pristine)
   *  into a signal so the per-field error computeds re-run on blur as well as
   *  on validator-state changes. Merging child events on top of `form.events`
   *  catches every per-control blur — the group only emits touched once. */
  private readonly formEvents = toSignal(
    merge(this.form.events, ...Object.values(this.form.controls).map((c) => c.events)).pipe(
      startWith(null),
      takeUntilDestroyed()
    ),
    { initialValue: null }
  );

  /** Surface the validator status text for the debug panel. */
  protected readonly formStatus = computed(() => {
    void this.formEvents();
    return this.form.status;
  });

  protected readonly nameError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.name;
    if (c.valid || !c.touched) return null;
    if (c.errors?.['required']) return 'Please enter your name.';
    if (c.errors?.['maxlength']) return 'Name is too long (max 60).';
    return null;
  });

  protected readonly emailError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.email;
    if (c.valid || !c.touched) return null;
    if (c.errors?.['required']) return 'Email is required.';
    if (c.errors?.['email']) return 'Please enter a valid email address.';
    return null;
  });

  protected readonly messageError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.message;
    if (c.valid || !c.touched) return null;
    if (c.errors?.['required']) return 'Message is required.';
    if (c.errors?.['minlength']) return 'Message must be at least 10 characters.';
    return null;
  });

  protected readonly consentError = computed(() => {
    void this.formEvents();
    const c = this.form.controls.consent;
    if (c.valid || !c.touched) return null;
    return 'You must agree before sending.';
  });

  protected readonly submittedJson = computed(() => {
    void this.formEvents();
    return JSON.stringify(this.form.getRawValue(), null, 2);
  });

  protected validateAll(): void {
    this.form.markAllAsTouched();
  }

  protected reset(): void {
    this.form.reset({ name: '', email: '', message: '', audience: 'recruiter', consent: false });
  }
}
