import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SkillTierGroup } from '@portfolio/landing/shared/data-access';
import type { RingNode } from './ddl-depth-map.v2.types';
import { RING, CX, CY } from './ddl-depth-map.v2.data';
import { placeOnRing } from './ddl-depth-map.v2.util';

/**
 * Depth Map · V2 — Concentric rings (SVG).
 *
 * 600 × 600 SVG, three concentric guide circles. Tools positioned evenly on
 * each ring — Daily inner (r=80, large labels), Frequent middle (r=180, mid
 * labels), Shipped outer (r=260, small mono labels). Rationale lives in a
 * stacked footnote list under the SVG so the ring stays legible at any count.
 *
 * Math note: starts at angle = -π/2 so the first item sits at 12 o'clock and
 * rotation reads "clockwise from top" — easier mental model than the default
 * math convention.
 */

@Component({
  selector: 'landing-ddl-depth-map-v2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dm2">
      <svg class="dm2__svg" viewBox="0 0 600 600" role="img" aria-label="Depth map — concentric tiers">
        <!-- Decorative concentric guide circles -->
        <circle class="dm2__ring dm2__ring--outer" [attr.cx]="cx" [attr.cy]="cy" [attr.r]="ringOuter" />
        <circle class="dm2__ring dm2__ring--mid" [attr.cx]="cx" [attr.cy]="cy" [attr.r]="ringMid" />
        <circle class="dm2__ring dm2__ring--inner" [attr.cx]="cx" [attr.cy]="cy" [attr.r]="ringInner" />

        <!-- Center label -->
        <text class="dm2__center" [attr.x]="cx" [attr.y]="cy" text-anchor="middle" dominant-baseline="middle">
          What I reach for
        </text>

        <!-- Shipped (outer) -->
        @for (n of shippedNodes(); track n.id) {
          <text
            class="dm2__node dm2__node--shipped"
            [attr.x]="n.x"
            [attr.y]="n.y"
            [attr.text-anchor]="n.anchor"
            dominant-baseline="middle"
          >
            {{ n.name }}
          </text>
        }

        <!-- Frequent (mid) -->
        @for (n of frequentNodes(); track n.id) {
          <text
            class="dm2__node dm2__node--frequent"
            [attr.x]="n.x"
            [attr.y]="n.y"
            [attr.text-anchor]="n.anchor"
            dominant-baseline="middle"
          >
            {{ n.name }}
          </text>
        }

        <!-- Daily (inner) -->
        @for (n of dailyNodes(); track n.id) {
          <g class="dm2__daily">
            <circle class="dm2__daily-dot" [attr.cx]="n.x" [attr.cy]="n.y" r="6" />
            <text
              class="dm2__node dm2__node--daily"
              [attr.x]="n.x"
              [attr.y]="n.y + 22"
              text-anchor="middle"
              dominant-baseline="middle"
            >
              {{ n.name }}
            </text>
          </g>
        }
      </svg>

      <!-- Rationale footnote — Daily only -->
      @if (dailyNodes().length > 0) {
        <div class="dm2__legend">
          <p class="dm2__legend-label">Why these are the daily drivers</p>
          <ul class="dm2__legend-list">
            @for (n of dailyNodes(); track n.id) {
              <li class="dm2__legend-item">
                <span class="dm2__legend-name">{{ n.name }}</span>
                <span class="dm2__legend-sep" aria-hidden="true">—</span>
                <span class="dm2__legend-note" [class.dm2__legend-note--placeholder]="!n.proficiencyNote">
                  {{ n.proficiencyNote ?? '(rationale TBD)' }}
                </span>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .dm2 {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dm2__svg {
      width: 100%;
      height: auto;
      max-width: 480px;
      margin-inline: auto;
    }

    .dm2__ring {
      fill: none;
      stroke: var(--landing-border);
      stroke-dasharray: 4 6;
    }

    .dm2__ring--inner {
      stroke: var(--landing-accent);
      stroke-dasharray: none;
      opacity: 0.5;
    }

    .dm2__center {
      font-family: var(--landing-font-mono);
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      fill: var(--landing-text-500);
    }

    .dm2__node {
      font-family: var(--landing-font-body);
    }

    .dm2__node--daily {
      font-size: 14px;
      font-weight: 600;
      fill: var(--landing-text-300);
    }

    .dm2__daily-dot {
      fill: var(--landing-accent);
    }

    .dm2__node--frequent {
      font-size: 12px;
      fill: var(--landing-text-400);
    }

    .dm2__node--shipped {
      font-family: var(--landing-font-mono);
      font-size: 10px;
      letter-spacing: 0.04em;
      fill: var(--landing-text-600);
    }

    .dm2__legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      border: 1px solid var(--landing-border);
      border-radius: 10px;
      background: var(--landing-bg);
    }

    .dm2__legend-label {
      margin: 0;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .dm2__legend-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .dm2__legend-item {
      font-size: var(--landing-body-sm);
      line-height: var(--landing-body-sm-lh);
      color: var(--landing-text-400);
    }

    .dm2__legend-name {
      color: var(--landing-text-300);
      font-weight: 600;
    }

    .dm2__legend-sep {
      margin-inline: 6px;
      color: var(--landing-text-600);
    }

    .dm2__legend-note--placeholder {
      font-style: italic;
      color: var(--landing-text-600);
    }
  `,
})
export class DdlDepthMapV2 {
  readonly groups = input.required<readonly SkillTierGroup[]>();

  protected readonly cx = CX;
  protected readonly cy = CY;
  protected readonly ringInner = RING.DAILY;
  protected readonly ringMid = RING.FREQUENT;
  protected readonly ringOuter = RING.SHIPPED;

  protected readonly dailyNodes = computed(() => this.nodesForTier('DAILY'));
  protected readonly frequentNodes = computed(() => this.nodesForTier('FREQUENT'));
  protected readonly shippedNodes = computed(() => this.nodesForTier('SHIPPED'));

  private nodesForTier(tier: 'DAILY' | 'FREQUENT' | 'SHIPPED'): readonly RingNode[] {
    const group = this.groups().find((g) => g.tier === tier);
    if (!group) return [];
    const r = RING[tier];
    return group.members.map((s, i) => placeOnRing(s, i, group.members.length, r));
  }
}
