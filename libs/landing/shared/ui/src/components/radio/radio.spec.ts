import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Radio } from './radio';
import { RadioGroup } from './radio-group';

@Component({
  standalone: true,
  imports: [RadioGroup, Radio],
  template: `
    <landing-radio-group [name]="groupName()" [(value)]="selected" [disabled]="disabled()" ariaLabel="Choose one">
      <landing-radio value="a" label="A" />
      <landing-radio value="b" label="B" />
      <landing-radio value="c" label="C" />
    </landing-radio-group>

    <landing-radio-group name="other" [(value)]="otherSelected">
      <landing-radio value="x" label="X" />
      <landing-radio value="y" label="Y" />
    </landing-radio-group>
  `,
})
class HostComponent {
  readonly groupName = signal('primary');
  readonly selected = signal<string | null>(null);
  readonly otherSelected = signal<string | null>(null);
  readonly disabled = signal(false);
}

describe('RadioComponent + RadioGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function radio(value: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[type="radio"][value="${value}"]`);
  }

  // ── D1 ──
  it('selects the clicked radio and unselects siblings', () => {
    radio('a').checked = true;
    radio('a').dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(radio('a').checked).toBe(true);
    expect(radio('b').checked).toBe(false);
  });

  it('updates the group value to the clicked radio value', () => {
    radio('b').checked = true;
    radio('b').dispatchEvent(new Event('change'));
    expect(host.selected()).toBe('b');
  });

  // ── D3 ──
  it('FormControl-style integration: writeValue and select both keep value in sync', () => {
    const group = fixture.debugElement.children[0].componentInstance as RadioGroup;

    group.writeValue('c');
    fixture.detectChanges();
    expect(radio('c').checked).toBe(true);

    let captured: string | null | undefined;
    group.registerOnChange((v) => (captured = v));
    radio('a').checked = true;
    radio('a').dispatchEvent(new Event('change'));
    expect(captured).toBe('a');
  });

  // ── D4 ──
  it('disables all radios when the group is disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    expect(radio('a').disabled).toBe(true);
    expect(radio('b').disabled).toBe(true);
    expect(radio('c').disabled).toBe(true);
  });

  it('ignores selection while disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    radio('a').checked = true;
    radio('a').dispatchEvent(new Event('change'));
    expect(host.selected()).toBeNull();
  });

  // ── D5 ──
  it('renders the label text on each radio', () => {
    const labels = fixture.nativeElement.querySelectorAll('.rad__label');
    expect(labels[0].textContent.trim()).toBe('A');
    expect(labels[1].textContent.trim()).toBe('B');
    expect(labels[2].textContent.trim()).toBe('C');
  });

  // ── D6 ──
  it('keeps two groups independent via separate name attributes', () => {
    radio('a').checked = true;
    radio('a').dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Selecting in the other group must not unselect the first.
    const xRadio = fixture.nativeElement.querySelector('input[type="radio"][value="x"]');
    xRadio.checked = true;
    xRadio.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.selected()).toBe('a');
    expect(host.otherSelected()).toBe('x');
    expect(radio('a').checked).toBe(true);
  });

  it('renders the radiogroup role with the ariaLabel passthrough', () => {
    const group = fixture.nativeElement.querySelector('.rgrp');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Choose one');
  });

  it('does not render aria-describedby when not provided', () => {
    const group = fixture.nativeElement.querySelector('.rgrp');
    expect(group.getAttribute('aria-describedby')).toBeNull();
  });

  it('puts the group name on each child radio so native HTML deduplicates selection', () => {
    expect(radio('a').name).toBe('primary');
    expect(radio('b').name).toBe('primary');
    expect(radio('c').name).toBe('primary');
  });
});
