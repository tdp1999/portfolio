import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  HostListener,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerOverlay } from '../spinner/spinner-overlay';

/**
 * macOS Quick Look-style preview overlay. Generic and content-projected: the
 * host supplies the body via `<ng-content>` and drives prev/next, so it is reused
 * across console features. Fully keyboard-driven once open:
 *   Esc / Space → close · ←/→ → prev/next
 * Opening (e.g. a preview button) is the host's responsibility.
 */
@Component({
  selector: 'console-quick-look',
  standalone: true,
  imports: [A11yModule, MatIconModule, SpinnerOverlay],
  templateUrl: './quick-look.html',
  styleUrl: './quick-look.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickLook {
  /** Two-way: bind `[(open)]`. The component sets it false on close. */
  readonly open = model<boolean>(false);
  readonly title = input<string>('');
  readonly loading = input<boolean>(false);
  readonly hasPrev = input<boolean>(false);
  readonly hasNext = input<boolean>(false);

  readonly prev = output<void>();
  readonly next = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  close(): void {
    this.open.set(false);
  }

  // Emit prev/next, then anchor focus on the (stable) panel. The projected body
  // swaps on navigation; without this, focus would sit on a destroyed element and
  // fall back to <body>, breaking the focus trap and subsequent keyboard nav.
  navPrev(): void {
    this.prev.emit();
    this.panel()?.nativeElement.focus();
  }

  navNext(): void {
    this.next.emit();
    this.panel()?.nativeElement.focus();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.open()) return;

    // Don't hijack typing inside form fields that may live in projected content.
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case ' ':
        if (typing) return;
        event.preventDefault();
        this.close();
        break;
      case 'ArrowLeft':
        if (typing || !this.hasPrev()) return;
        event.preventDefault();
        this.navPrev();
        break;
      case 'ArrowRight':
        if (typing || !this.hasNext()) return;
        event.preventDefault();
        this.navNext();
        break;
    }
  }
}
