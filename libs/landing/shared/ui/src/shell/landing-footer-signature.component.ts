import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'landing-footer-signature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="mt-24 border-t border-landing-border" role="contentinfo">
      <div class="mx-auto max-w-6xl px-6 py-8">
        <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500">
          // PORTFOLIO · {{ year }} · BUILT BY THUNDER PHONG
        </p>
      </div>
    </footer>
  `,
})
export class LandingFooterSignatureComponent {
  readonly year = new Date().getFullYear();
}
