import { ChangeDetectionStrategy, Component, computed, HostListener, inject, linkedSignal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { isEditableTarget } from '@portfolio/shared/ui';
import { QuickLook } from '../quick-look/quick-look';
import { HelpService } from '../../services/help/help.service';
import { guidePath } from '../../services/help/help.util';

const DEFAULT_TITLE = 'Feature guide';

// The "open in a new tab" link uses a native `title`, not matTooltip: the focus trap
// lands on it when the window opens, and a shown matTooltip swallows the first Escape.

/**
 * The one feature-guide window of the console, mounted in the app shell. Renders the
 * open guide (HelpService) in a document-mode QuickLook, and owns the global `?` key
 * that opens the current page's guide.
 */
@Component({
  selector: 'console-help-viewer',
  standalone: true,
  imports: [QuickLook, MatIconModule],
  templateUrl: './help-viewer.html',
  styleUrl: './help-viewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpViewer {
  private readonly help = inject(HelpService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly isOpen = computed(() => this.help.opened() !== null);
  protected readonly path = computed(() => {
    const ref = this.help.opened();
    return ref ? guidePath(ref) : null;
  });
  // The path only ever comes from guidePath(), which admits `/guides/<slug>.html` alone.
  protected readonly src = computed(() => {
    const path = this.path();
    return path ? this.sanitizer.bypassSecurityTrustResourceUrl(path) : null;
  });
  // Reset on every new guide; replaced by the guide's own <title> once it loads.
  protected readonly title = linkedSignal({ source: this.path, computation: () => DEFAULT_TITLE });
  protected readonly loading = linkedSignal({ source: this.path, computation: () => true });

  onOpenChange(open: boolean): void {
    if (!open) this.help.close();
  }

  onFrameLoad(frame: HTMLIFrameElement): void {
    this.loading.set(false);
    // Same origin (a console asset), so the document is reachable. Focus inside the
    // iframe keeps Escape from reaching QuickLook's listener; relay it from here.
    const doc = frame.contentDocument;
    if (!doc) return;
    if (doc.title) this.title.set(doc.title);
    doc.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.help.close();
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== '?' || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditableTarget(event.target) || this.isOpen()) return;
    const ref = this.help.pageGuide();
    if (!ref) return;
    event.preventDefault();
    this.help.open(ref.guide, ref.section);
  }
}
