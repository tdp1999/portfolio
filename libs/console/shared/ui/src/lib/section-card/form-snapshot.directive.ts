import { DestroyRef, Directive, effect, inject, input } from '@angular/core';
import { SectionCardComponent } from './section-card.component';

/**
 * Captures a pristine snapshot of the host section-card's FormGroup and restores
 * it when the card emits `cancel`. For forms that contain FormArrays whose items
 * may be added or removed, pass a `[formSnapshotRebuild]` callback — the default
 * `reset(snapshot)` only restores values, not array structure.
 */
@Directive({
  selector: 'console-section-card[consoleFormSnapshot]',
  standalone: true,
})
export class FormSnapshotDirective {
  private readonly card = inject(SectionCardComponent);
  private readonly destroyRef = inject(DestroyRef);

  readonly consoleFormSnapshotRebuild = input<((snapshot: unknown) => void) | undefined>(undefined);

  private snapshot: unknown = null;

  constructor() {
    effect((onCleanup) => {
      const fg = this.card.formGroup();
      if (!fg) return;
      this.snapshot = fg.getRawValue();
      // Defer capture to a microtask so synchronous sequences like
      // `arr.push(item); arr.markAsDirty();` resolve to the final state
      // (dirty) before we decide whether to snapshot. Without this,
      // the push's ValueChangeEvent fires while pristine is still true
      // and the new item gets baked into the snapshot.
      let scheduled = false;
      const sub = fg.events.subscribe(() => {
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => {
          scheduled = false;
          if (fg.pristine) this.snapshot = fg.getRawValue();
        });
      });
      onCleanup(() => sub.unsubscribe());
    });

    const cancelSub = this.card.cancelled.subscribe(() => this.restore());
    this.destroyRef.onDestroy(() => cancelSub.unsubscribe());
  }

  private restore(): void {
    const fg = this.card.formGroup();
    if (!fg || this.snapshot === null) return;
    const fn = this.consoleFormSnapshotRebuild();
    if (fn) fn(this.snapshot);
    else fg.reset(this.snapshot);
    fg.markAsPristine();
    fg.markAsUntouched();
  }
}
