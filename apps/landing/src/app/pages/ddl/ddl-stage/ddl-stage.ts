import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

// Wraps a page-level / full-bleed demo. Inline it fills the doc column (a
// thumbnail), but the "Full width" button promotes the SAME content into a
// fixed full-viewport overlay — so the demo renders at its true production
// width and its internal media queries fire against the real viewport. No
// iframe, no preview route: one live instance, toggled between column and
// full-screen. Esc or the close button collapses it.
@Component({
  selector: 'landing-ddl-stage',
  standalone: true,
  templateUrl: './ddl-stage.html',
  styleUrl: './ddl-stage.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlStage {
  // Shown on the overlay header; identifies which demo is expanded.
  readonly label = input('preview');

  // How the projected demo is framed — mirrors `landing-container` so a demo
  // renders at the same width + gutters it would on a real page:
  //   content → max-w-6xl (default page body) · wide → max-w-7xl ·
  //   full → no constraint (use when the demo brings its own landing-container).
  readonly width = input<'content' | 'wide' | 'full'>('content');

  protected readonly expanded = signal(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') this.close();
    };

    // Lock body scroll + wire Esc only while the overlay is open.
    effect(() => {
      if (this.expanded()) {
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
      } else {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      }
    });

    this.destroyRef.onDestroy(() => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    });
  }

  protected open(): void {
    this.expanded.set(true);
  }

  protected close(): void {
    this.expanded.set(false);
  }
}
