import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  Signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'console-section-card',
  standalone: true,
  imports: [MatButtonModule, ReactiveFormsModule],
  templateUrl: './section-card.component.html',
  styleUrl: './section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  /** Anchor id for scrollspy (rendered as HTML id attribute) */
  // eslint-disable-next-line @angular-eslint/no-input-rename -- alias matches native DOM `id` attribute
  sectionId = input.required<string>({ alias: 'id' });

  /** Section title shown in the description column */
  title = input.required<string>();

  /** Section description/helper text shown below the title */
  description = input.required<string>();

  /** Optional FormGroup for dirty/invalid tracking in per-section mode */
  formGroup = input<FormGroup>();

  /** Save mode: per-section shows footer with save/cancel, atomic has no footer */
  saveMode = input<'per-section' | 'atomic'>('atomic');

  /** Whether a save request is in progress */
  saving = input<Signal<boolean>>();

  /** Timestamp of last successful save */
  lastSavedAt = input<Signal<Date | null>>();

  /** Error message to display in the card footer */
  errorMessage = input<Signal<string | null>>();

  /** Emitted when the user clicks Save in per-section mode */
  save = output<void>();

  /**
   * Emitted when the user clicks Cancel. Consumers own form-state restoration —
   * apply `formSnapshot` directive for the default snapshot/restore behaviour.
   */
  cancelled = output<void>();

  constructor() {
    // Keep OnPush re-rendering in sync with FormGroup state changes (dirty/invalid).
    effect((onCleanup) => {
      const fg = this.formGroup();
      if (!fg) return;
      const sub = fg.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
      onCleanup(() => sub.unsubscribe());
    });
  }

  /** Relative time string for last saved */
  lastSavedLabel = computed(() => {
    const date = this.lastSavedAt()?.();
    if (!date) return null;
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'Saved just now';
    if (seconds < 60) return `Saved ${seconds}s ago`;
    return `Saved ${Math.floor(seconds / 60)}m ago`;
  });

  /** Whether the save button should be disabled (reads FormGroup state imperatively) */
  isSaveDisabled(): boolean {
    const fg = this.formGroup();
    if (!fg) return true;
    const isSaving = this.saving()?.() ?? false;
    return fg.invalid || !fg.dirty || isSaving;
  }

  /** Whether the cancel button should be disabled */
  isCancelDisabled(): boolean {
    const fg = this.formGroup();
    if (!fg) return true;
    const isSaving = this.saving()?.() ?? false;
    return !fg.dirty || isSaving;
  }

  onSave(): void {
    this.save.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
