import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { FormField } from './form-field';

@Component({
  standalone: true,
  imports: [FormField],
  template: `
    <landing-form-field
      [label]="label()"
      [hint]="hint()"
      [error]="error()"
      [required]="required()"
      [inputId]="inputId()"
      [metaId]="metaId()"
    >
      <input id="slot-input" />
    </landing-form-field>
  `,
})
class HostComponent {
  readonly label = signal('');
  readonly hint = signal('');
  readonly error = signal<string | null>(null);
  readonly required = signal(false);
  readonly inputId = signal('');
  readonly metaId = signal('');
}

describe('FormFieldComponent — hint/error contract', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── E1 ──
  it('renders neither label nor meta row when none of label/hint/error is set', () => {
    expect(fixture.nativeElement.querySelector('.ff__label')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ff__meta')).toBeNull();
  });

  it('always projects the input slot regardless of label/meta state', () => {
    expect(fixture.nativeElement.querySelector('#slot-input')).not.toBeNull();
  });

  // ── E2 ──
  it('renders the label when set', () => {
    host.label.set('Email');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.ff__label');
    expect(label).not.toBeNull();
    expect(label.textContent).toContain('Email');
  });

  // ── E3 ──
  it('renders the required asterisk only when required=true', () => {
    host.label.set('Email');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ff__required')).toBeNull();

    host.required.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ff__required')).not.toBeNull();
  });

  // ── E4 ──
  it('renders only the hint when hint is set and error is empty', () => {
    host.hint.set('10–5000 characters');
    fixture.detectChanges();
    const meta = fixture.nativeElement.querySelector('.ff__meta');
    expect(meta).not.toBeNull();
    const hint = fixture.nativeElement.querySelector('.ff__hint');
    const error = fixture.nativeElement.querySelector('.ff__error');
    expect(hint).not.toBeNull();
    expect(hint.textContent).toContain('10–5000 characters');
    expect(error).toBeNull();
  });

  // ── E5 ──
  it('renders only the error when error is set and hint is empty', () => {
    host.error.set('Required field');
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.ff__error');
    const hint = fixture.nativeElement.querySelector('.ff__hint');
    expect(error).not.toBeNull();
    expect(error.textContent).toContain('Required field');
    expect(error.getAttribute('role')).toBe('alert');
    expect(hint).toBeNull();
  });

  // ── E7 — the priority contract ──
  it('hides the hint and renders only the error when BOTH are set (error wins)', () => {
    host.hint.set('10–5000 characters');
    host.error.set('Message is required');
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.ff__error');
    const hint = fixture.nativeElement.querySelector('.ff__hint');
    expect(error).not.toBeNull();
    expect(error.textContent).toContain('Message is required');
    expect(hint).toBeNull();
  });

  // ── E8 ──
  it('falls back to the hint after the error is cleared', () => {
    host.hint.set('Helpful hint');
    host.error.set('Validation error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ff__hint')).toBeNull();

    host.error.set(null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ff__hint')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ff__error')).toBeNull();
  });

  // ── E9 ──
  it('puts metaId on the meta wrapper when meta row renders', () => {
    host.hint.set('Has hint');
    host.metaId.set('my-meta-id');
    fixture.detectChanges();
    const meta = fixture.nativeElement.querySelector('.ff__meta');
    expect(meta.getAttribute('id')).toBe('my-meta-id');
  });

  it('does not render a meta wrapper at all when neither error nor hint is set, even with metaId', () => {
    host.metaId.set('unused');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ff__meta')).toBeNull();
  });

  // ── E10 ──
  it('puts inputId on the label `for` attribute', () => {
    host.label.set('Email');
    host.inputId.set('contact-email');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.ff__label');
    expect(label.getAttribute('for')).toBe('contact-email');
  });

  it('does not render the for attribute when inputId is empty', () => {
    host.label.set('Email');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.ff__label');
    expect(label.getAttribute('for')).toBeNull();
  });
});
