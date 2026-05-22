import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { FailureEssay } from '@portfolio/landing/feature-about';

/**
 * Failures · V2 — Numbered editorial.
 *
 * Stacked vertical layout. Each essay carries a mono number (01/02/03) +
 * eyebrow (year · context), an italic display heading taken from the decision,
 * and prose stanzas for consequence + lesson. Reads like a journal — slower
 * pace than V1, more space for the prose to breathe. Best when essays are
 * read top-to-bottom rather than scanned.
 */

type NumberedEssay = FailureEssay & { readonly num: string };

@Component({
  selector: 'landing-failures-v2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="fv2" role="list">
      @for (e of numbered(); track e.id) {
        <li class="fv2__item">
          <div class="fv2__rail">
            <span class="fv2__num">{{ e.num }}</span>
            <span class="fv2__rail-line" aria-hidden="true"></span>
          </div>
          <div class="fv2__body">
            <p class="fv2__eyebrow">
              <span class="fv2__year">{{ e.year }}</span>
              <span class="fv2__sep" aria-hidden="true">·</span>
              <span>{{ e.context }}</span>
            </p>
            <h3 class="fv2__heading">{{ e.decision }}</h3>
            <p class="fv2__prose">{{ e.consequence }}</p>
            <p class="fv2__lesson">
              <span class="fv2__lesson-label">Lesson</span>
              {{ e.lesson }}
            </p>
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
    }

    .fv2 {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 56px;
    }

    .fv2__item {
      display: grid;
      grid-template-columns: 56px 1fr;
      gap: 16px;
    }

    .fv2__rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .fv2__num {
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-md);
      letter-spacing: var(--landing-tracking-mono);
      color: var(--landing-accent);
    }

    .fv2__rail-line {
      flex: 1;
      width: 1px;
      background: var(--landing-border);
      min-height: 32px;
    }

    .fv2__body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }

    .fv2__eyebrow {
      margin: 0;
      display: flex;
      gap: 8px;
      align-items: center;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .fv2__year {
      color: var(--landing-text-400);
    }

    .fv2__sep {
      color: var(--landing-text-700);
    }

    .fv2__heading {
      margin: 0;
      font-family: var(--landing-font-display);
      font-style: italic;
      font-weight: 400;
      font-size: var(--landing-body-xl);
      line-height: var(--landing-body-xl-lh);
      color: var(--landing-text-300);
    }

    .fv2__prose {
      margin: 0;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-md);
      line-height: var(--landing-body-md-lh);
      color: var(--landing-text-400);
    }

    .fv2__lesson {
      margin: 0;
      padding-top: 12px;
      border-top: 1px solid var(--landing-border);
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-md);
      line-height: var(--landing-body-md-lh);
      color: var(--landing-text-300);
    }

    .fv2__lesson-label {
      display: inline-block;
      margin-right: 8px;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-accent);
    }
  `,
})
export class FailuresV2Component {
  readonly essays = input.required<readonly FailureEssay[]>();

  protected readonly numbered = computed<readonly NumberedEssay[]>(() =>
    this.essays().map((e, i) => ({ ...e, num: String(i + 1).padStart(2, '0') }))
  );
}
