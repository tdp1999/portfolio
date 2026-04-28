import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  PLATFORM_ID,
  inject,
  input,
  output,
  signal,
  Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  host: {
    '[style.--console-scrollbar-width.px]': 'scrollbarWidth()',
  },
})
export class StickySaveBarComponent implements AfterViewInit {
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly scrollbarWidth = signal(0);

  /** Whether the form has unsaved changes */
  dirty = input.required<Signal<boolean>>();

  /** Whether a save request is in progress */
  saving = input.required<Signal<boolean>>();

  /** Emitted when the user clicks save. Parent handles validity (markAllAsTouched + scroll) and dispatch. */
  save = output<void>();

  /** Emitted when the user confirms discard */
  discard = output<void>();

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.measureScrollbar();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.measureScrollbar();
  }

  private measureScrollbar(): void {
    // The scrollable container (.console-content) reserves space for its scrollbar;
    // the fixed save bar uses this to subtract that width from its right edge so it
    // visually aligns with the scroll-clipped content area.
    const scroller = document.querySelector('.console-content') as HTMLElement | null;
    if (!scroller) return;
    const width = scroller.offsetWidth - scroller.clientWidth;
    this.scrollbarWidth.set(width);
  }

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
