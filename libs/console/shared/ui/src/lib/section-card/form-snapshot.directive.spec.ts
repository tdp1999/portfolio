import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { SectionCardComponent } from './section-card.component';
import { FormSnapshotDirective } from './form-snapshot.directive';

@Component({
  standalone: true,
  imports: [SectionCardComponent, FormSnapshotDirective, ReactiveFormsModule],
  template: `
    <console-section-card
      id="s"
      title="t"
      description="d"
      saveMode="per-section"
      formSnapshot
      [formSnapshotRebuild]="rebuild"
      [formGroup]="form"
      [saving]="saving"
      [lastSavedAt]="lastSavedAt"
      [errorMessage]="errorMessage"
    ></console-section-card>
  `,
})
class HostComponent {
  readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    name: this.fb.control('Alice', { nonNullable: true }),
    tags: this.fb.array<FormControl<string>>([
      this.fb.control('a', { nonNullable: true }),
      this.fb.control('b', { nonNullable: true }),
    ]),
  });
  readonly saving = signal(false);
  readonly lastSavedAt = signal<Date | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly rebuild = (snap: unknown): void => {
    const s = snap as { name: string; tags: string[] };
    const arr = this.form.controls.tags;
    arr.clear();
    for (const t of s.tags) arr.push(this.fb.control(t, { nonNullable: true }));
    this.form.controls.name.setValue(s.name);
  };
}

describe('FormSnapshotDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let cancelBtn: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    cancelBtn = fixture.nativeElement.querySelectorAll('.section-card__footer-actions button')[0] as HTMLButtonElement;
  });

  it('restores scalar values on cancel (via rebuild fn)', () => {
    host.form.controls.name.setValue('Bob');
    host.form.controls.name.markAsDirty();
    fixture.detectChanges();
    cancelBtn.click();
    fixture.detectChanges();
    expect(host.form.controls.name.value).toBe('Alice');
    expect(host.form.pristine).toBe(true);
  });

  it('restores FormArray length after items added', () => {
    host.form.controls.tags.push(host.fb.control('c', { nonNullable: true }));
    host.form.markAsDirty();
    fixture.detectChanges();
    cancelBtn.click();
    fixture.detectChanges();
    expect(host.form.controls.tags.length).toBe(2);
    expect(host.form.controls.tags.value).toEqual(['a', 'b']);
  });

  it('restores FormArray length after items removed', () => {
    host.form.controls.tags.removeAt(0);
    host.form.markAsDirty();
    fixture.detectChanges();
    cancelBtn.click();
    fixture.detectChanges();
    expect(host.form.controls.tags.length).toBe(2);
    expect(host.form.controls.tags.value).toEqual(['a', 'b']);
  });

  it('re-captures snapshot when form becomes pristine (post-save)', () => {
    host.form.controls.name.setValue('Bob');
    host.form.markAsPristine();
    fixture.detectChanges();
    host.form.controls.name.setValue('Carol');
    host.form.markAsDirty();
    fixture.detectChanges();
    cancelBtn.click();
    fixture.detectChanges();
    expect(host.form.controls.name.value).toBe('Bob');
  });
});
