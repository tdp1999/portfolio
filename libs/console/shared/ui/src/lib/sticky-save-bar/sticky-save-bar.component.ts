import { ChangeDetectionStrategy, Component, computed, inject, input, output, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import ConfirmDialogComponent, { ConfirmDialogData } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'console-sticky-save-bar',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './sticky-save-bar.component.html',
  styleUrl: './sticky-save-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickySaveBarComponent {
  private readonly dialog = inject(MatDialog);

  /** Whether the form has unsaved changes */
  dirty = input.required<Signal<boolean>>();

  /** Whether a save request is in progress */
  saving = input.required<Signal<boolean>>();

  /** Optional disabled override (e.g., form invalid) */
  disabled = input<Signal<boolean>>();

  /** Emitted when the user confirms save */
  save = output<void>();

  /** Emitted when the user confirms discard */
  discard = output<void>();

  readonly isSaveDisabled = computed(() => this.saving()() || (this.disabled()?.() ?? false));

  onSave(): void {
    this.save.emit();
  }

  async onDiscard(): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Discard Changes',
            message: 'Are you sure you want to discard all unsaved changes?',
            confirmLabel: 'Discard',
          } satisfies ConfirmDialogData,
        })
        .afterClosed()
    );

    if (confirmed) {
      this.discard.emit();
    }
  }
}
