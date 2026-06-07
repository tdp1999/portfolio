import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Container, Eyebrow, Heading, LandingLocaleService, T } from '@portfolio/landing/shared/ui';
import { PrincipleService, type PublicAboutPrinciple } from '@portfolio/landing/shared/data-access';

interface RenderedPrinciple {
  id: string;
  number: string;
  claim: string;
  expansion: string;
}

@Component({
  selector: 'landing-about-how-i-think',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Heading, T],
  templateUrl: './about.how-i-think.html',
  styleUrl: './about.how-i-think.scss',
})
export class AboutHowIThink {
  private readonly locale = inject(LandingLocaleService).locale;
  private readonly principleService = inject(PrincipleService);

  private readonly raw = toSignal(this.principleService.getPublicPrinciples(), {
    initialValue: [] as readonly PublicAboutPrinciple[],
  });

  /** Localized principle list with EN-fallback per-item — preserves the
   *  layout if a translation is missing. Ordering follows the BE `order`
   *  field (BE already sorts by `order asc`). Numbering is computed from
   *  the array index so the published order is the canonical numbering. */
  protected readonly principles = computed<readonly RenderedPrinciple[]>(() => {
    const loc = this.locale();
    return this.raw().map((p, i) => {
      const claimEn = (p.claim?.en ?? '').trim();
      const expansionEn = (p.expansion?.en ?? '').trim();
      const claimLoc = loc === 'vi' ? (p.claim?.vi ?? '').trim() : claimEn;
      const expansionLoc = loc === 'vi' ? (p.expansion?.vi ?? '').trim() : expansionEn;
      return {
        id: p.id,
        number: String(i + 1).padStart(2, '0'),
        claim: claimLoc || claimEn,
        expansion: expansionLoc || expansionEn,
      };
    });
  });

  protected readonly isEmpty = computed(() => this.principles().length === 0);
}
