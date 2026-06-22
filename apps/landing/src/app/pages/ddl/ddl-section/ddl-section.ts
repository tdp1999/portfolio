import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, input, signal } from '@angular/core';

// One stacked doc section = an anchored H2 + projected body. `framed` wraps the
// body in a preview canvas (for live demos); plain sections hold prose. The
// `anchor` id is what the right-hand TOC scrollspy tracks. Replaces the old
// Showcase/Usage tab switch — each is now its own scannable heading.
@Component({
  selector: 'landing-ddl-section',
  standalone: true,
  templateUrl: './ddl-section.html',
  styleUrl: './ddl-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlSection {
  readonly anchor = input.required<string>();
  readonly heading = input.required<string>();
  readonly framed = input(false);
  readonly code = input('');

  protected readonly copied = signal(false);
  private readonly platformId = inject(PLATFORM_ID);

  protected async copy(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      // clipboard blocked (insecure context / permissions) — non-fatal
    }
  }
}
