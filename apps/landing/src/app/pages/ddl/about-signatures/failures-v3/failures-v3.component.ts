import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { FailureEssay } from '@portfolio/landing/feature-about';

/**
 * Failures · V3 — Prose with pull-quote lesson.
 *
 * Stacked vertical essays. Each one reads as a single body of prose
 * (decision + consequence flow as one paragraph block) with the **lesson
 * elevated as a pull-quote**: large italic display type, accent left-rule,
 * sits offset from the prose column. The lesson is the takeaway you want to
 * stick — V3 makes the section read like a series of editorial vignettes
 * each ending on a quoted line.
 */
@Component({
  selector: 'landing-failures-v3',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="fv3" role="list">
      @for (e of essays(); track e.id) {
        <li class="fv3__essay">
          <header class="fv3__head">
            <span class="fv3__year">{{ e.year }}</span>
            <span class="fv3__sep" aria-hidden="true">·</span>
            <span class="fv3__context">{{ e.context }}</span>
          </header>

          <div class="fv3__prose">
            <p>{{ e.decision }}</p>
            <p>{{ e.consequence }}</p>
          </div>

          <blockquote class="fv3__quote">
            <p class="fv3__quote-text">{{ e.lesson }}</p>
            <footer class="fv3__quote-foot">Lesson, applied since.</footer>
          </blockquote>
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      display: block;
    }

    .fv3 {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 64px;
    }

    .fv3__essay {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .fv3__essay + .fv3__essay {
      padding-top: 64px;
      border-top: 1px solid var(--landing-border);
    }

    .fv3__head {
      display: flex;
      gap: 8px;
      align-items: center;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
    }

    .fv3__year {
      color: var(--landing-accent);
    }

    .fv3__sep {
      color: var(--landing-text-700);
    }

    .fv3__context {
      color: var(--landing-text-400);
    }

    .fv3__prose {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 60ch;
    }

    .fv3__prose p {
      margin: 0;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-md);
      line-height: var(--landing-body-md-lh);
      color: var(--landing-text-400);
    }

    .fv3__quote {
      position: relative;
      margin: 8px 0 0;
      padding: 16px 0 16px 24px;
      border-left: 2px solid var(--landing-accent);
      max-width: 60ch;
    }

    .fv3__quote-text {
      margin: 0;
      font-family: var(--landing-font-display);
      font-style: italic;
      font-weight: 400;
      font-size: var(--landing-body-xl);
      line-height: var(--landing-body-xl-lh);
      color: var(--landing-text-300);
    }

    .fv3__quote-foot {
      margin-top: 12px;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }
  `,
})
export class FailuresV3Component {
  readonly essays = input.required<readonly FailureEssay[]>();
}
