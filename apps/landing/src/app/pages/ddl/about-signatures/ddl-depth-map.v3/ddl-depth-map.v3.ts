import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chip } from '@portfolio/landing/shared/ui';
import type { SkillTierGroup } from '@portfolio/landing/shared/data-access';

/**
 * Depth Map · V3 — Constellation.
 *
 * Daily tools as anchored "stars" — each is a labeled card with icon + name +
 * rationale on its own line, connected back to a central pivot label by a
 * thin accent rule on the left. Frequent + Shipped cluster below as smaller
 * chip rows. Editorial voice: each Daily entry reads like a journal annotation
 * rather than a chip.
 */
@Component({
  selector: 'landing-ddl-depth-map-v3',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chip],
  template: `
    <div class="dm3">
      <p class="dm3__pivot">My daily drivers — and why I reach for them first.</p>

      @if (daily(); as g) {
        <ul class="dm3__stars" role="list">
          @for (s of g.members; track s.id) {
            <li class="dm3__star">
              <span class="dm3__star-rule" aria-hidden="true"></span>
              <span class="dm3__star-icon" aria-hidden="true">
                @if (s.iconUrl) {
                  <img [src]="s.iconUrl" [alt]="''" loading="lazy" decoding="async" />
                } @else {
                  <span class="dm3__star-letter">{{ s.name.charAt(0) }}</span>
                }
              </span>
              <div class="dm3__star-body">
                <p class="dm3__star-name">{{ s.name }}</p>
                <p class="dm3__star-note" [class.dm3__star-note--placeholder]="!s.proficiencyNote">
                  {{ s.proficiencyNote ?? '(rationale TBD)' }}
                </p>
              </div>
            </li>
          }
        </ul>
      }

      @if (frequent(); as g) {
        @if (g.members.length > 0) {
          <div class="dm3__cluster">
            <p class="dm3__cluster-label">{{ g.label }}</p>
            <ul class="dm3__chip-wrap" role="list">
              @for (s of g.members; track s.id) {
                <li>
                  <landing-chip [label]="s.name" [iconUrl]="s.iconUrl" size="sm" prominence="strong" />
                </li>
              }
            </ul>
          </div>
        }
      }

      @if (shipped(); as g) {
        @if (g.members.length > 0) {
          <div class="dm3__cluster dm3__cluster--quiet">
            <p class="dm3__cluster-label">{{ g.label }}</p>
            <ul class="dm3__mono-row" role="list">
              @for (s of g.members; track s.id; let last = $last) {
                <li class="dm3__mono-item">
                  <span>{{ s.name }}</span>
                  @if (!last) {
                    <span aria-hidden="true" class="dm3__mono-sep">·</span>
                  }
                </li>
              }
            </ul>
          </div>
        }
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .dm3 {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .dm3__pivot {
      margin: 0;
      font-family: var(--landing-font-display);
      font-style: italic;
      font-size: var(--landing-body-xl);
      line-height: var(--landing-body-xl-lh);
      color: var(--landing-text-300);
    }

    /* ─── Daily stars ─── */

    .dm3__stars {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .dm3__star {
      position: relative;
      display: grid;
      grid-template-columns: auto auto 1fr;
      align-items: start;
      gap: 12px;
      padding-left: 16px;
    }

    .dm3__star-rule {
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 1px;
      background: var(--landing-accent);
    }

    .dm3__star-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: var(--landing-surface);
      border: 1px solid var(--landing-border);
      overflow: hidden;
    }

    .dm3__star-icon img {
      width: 70%;
      height: 70%;
      object-fit: contain;
    }

    .dm3__star-letter {
      font-family: var(--landing-font-display);
      color: var(--landing-text-400);
    }

    .dm3__star-body {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dm3__star-name {
      margin: 0;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-md);
      font-weight: 600;
      color: var(--landing-text-300);
    }

    .dm3__star-note {
      margin: 0;
      font-size: var(--landing-body-sm);
      line-height: var(--landing-body-sm-lh);
      color: var(--landing-text-400);
    }

    .dm3__star-note--placeholder {
      font-style: italic;
      color: var(--landing-text-600);
    }

    /* ─── Clusters ─── */

    .dm3__cluster {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .dm3__cluster-label {
      margin: 0;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .dm3__chip-wrap {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .dm3__cluster--quiet .dm3__cluster-label {
      color: var(--landing-text-600);
    }

    .dm3__mono-row {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0 6px;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .dm3__mono-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .dm3__mono-sep {
      color: var(--landing-text-700);
    }
  `,
})
export class DdlDepthMapV3 {
  readonly groups = input.required<readonly SkillTierGroup[]>();

  protected readonly daily = computed(() => this.groups().find((g) => g.tier === 'DAILY'));
  protected readonly frequent = computed(() => this.groups().find((g) => g.tier === 'FREQUENT'));
  protected readonly shipped = computed(() => this.groups().find((g) => g.tier === 'SHIPPED'));
}
