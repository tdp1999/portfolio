import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChipComponent } from '@portfolio/landing/shared/ui';
import type { SkillTierGroup } from '@portfolio/landing/shared/data-access';

/**
 * Depth Map · V1 — Tiered grid.
 *
 * Three labeled rows; Daily dominates visually with name + 1-line rationale per
 * item; Frequent + Shipped collapse to chip wraps at decreasing prominence.
 * The clearest read of "depth vs breadth" — Daily is loud, the rest is quiet
 * acknowledgement of working knowledge.
 */
@Component({
  selector: 'landing-depth-map-v1',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChipComponent],
  template: `
    <div class="dm1">
      @for (g of groups(); track g.tier) {
        @if (g.members.length > 0) {
          <div class="dm1__tier" [attr.data-tier]="g.tier">
            <p class="dm1__tier-label">{{ g.label }}</p>

            @if (g.tier === 'DAILY') {
              <ul class="dm1__daily-grid" role="list">
                @for (s of g.members; track s.id) {
                  <li class="dm1__daily-item">
                    <span class="dm1__icon" aria-hidden="true">
                      @if (s.iconUrl) {
                        <img [src]="s.iconUrl" [alt]="''" loading="lazy" decoding="async" />
                      } @else {
                        <span class="dm1__icon-letter">{{ s.name.charAt(0) }}</span>
                      }
                    </span>
                    <div class="dm1__daily-body">
                      <p class="dm1__name">{{ s.name }}</p>
                      <p class="dm1__note" [class.dm1__note--placeholder]="!s.proficiencyNote">
                        {{ s.proficiencyNote ?? '(rationale TBD)' }}
                      </p>
                    </div>
                  </li>
                }
              </ul>
            } @else {
              <ul class="dm1__chip-wrap" role="list">
                @for (s of g.members; track s.id) {
                  <li>
                    <landing-chip
                      [label]="s.name"
                      [iconUrl]="s.iconUrl"
                      size="sm"
                      [prominence]="g.tier === 'FREQUENT' ? 'strong' : 'default'"
                    />
                  </li>
                }
              </ul>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .dm1 {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .dm1__tier-label {
      margin: 0 0 12px;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .dm1__tier[data-tier='DAILY'] .dm1__tier-label {
      color: var(--landing-accent);
    }

    .dm1__daily-grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 640px) {
      .dm1__daily-grid {
        grid-template-columns: 1fr;
      }
    }

    .dm1__daily-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--landing-border);
      border-radius: 10px;
      background: var(--landing-bg);
    }

    .dm1__icon {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--landing-surface);
      overflow: hidden;
    }

    .dm1__icon img {
      width: 70%;
      height: 70%;
      object-fit: contain;
    }

    .dm1__icon-letter {
      font-family: var(--landing-font-display);
      color: var(--landing-text-400);
    }

    .dm1__daily-body {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dm1__name {
      margin: 0;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-md);
      font-weight: 600;
      color: var(--landing-text-300);
    }

    .dm1__note {
      margin: 0;
      font-size: var(--landing-body-sm);
      line-height: var(--landing-body-sm-lh);
      color: var(--landing-text-400);
    }

    .dm1__note--placeholder {
      font-style: italic;
      color: var(--landing-text-600);
    }

    .dm1__chip-wrap {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class DepthMapV1Component {
  readonly groups = input.required<readonly SkillTierGroup[]>();
}
