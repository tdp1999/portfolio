import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContainerComponent } from '../components/container';

@Component({
  selector: 'landing-footer-signature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent],
  template: `
    <footer class="mt-24 border-t border-landing-border" role="contentinfo">
      <landing-container size="wide">
        <p class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 py-8">
          // PORTFOLIO · {{ year }} · BUILT BY THUNDER PHONG
        </p>
      </landing-container>
    </footer>
  `,
})
export class LandingFooterSignatureComponent {
  readonly year = new Date().getFullYear();
}
