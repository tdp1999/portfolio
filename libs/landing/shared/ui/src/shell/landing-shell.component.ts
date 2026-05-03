import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingHeaderComponent } from './landing-header.component';
import { LandingFooterSignatureComponent } from './landing-footer-signature.component';
import { LandingScrollToTopComponent } from './landing-scroll-to-top.component';

@Component({
  selector: 'landing-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LandingHeaderComponent, LandingFooterSignatureComponent, LandingScrollToTopComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-ink-0 text-landing-text-300">
      <landing-header />
      <main class="flex-1">
        <ng-content />
      </main>
      <landing-footer-signature />
      <landing-scroll-to-top />
    </div>
  `,
})
export class LandingShellComponent {}
