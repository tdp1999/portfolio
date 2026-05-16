import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LandingIconArrowComponent } from '@portfolio/landing/shared/ui';

export type UsesEntry = {
  readonly name: string;
  readonly monogram: string;
  readonly reason: string;
  readonly href?: string;
};

export type UsesSection = {
  readonly num: string;
  readonly id: string;
  readonly title: string;
  readonly entries: readonly UsesEntry[];
};

/**
 * /uses category block — DDL `uses-card-variants` V2 + S1 (locked 2026-05-16).
 *
 * Layout: number eyebrow + display-sm heading + 2-col responsive grid of
 * monogram-tile mini-cards. Sub-page quiet tone: borders only (no box-shadow),
 * indigo accent on hover, `prefers-reduced-motion` honoured.
 */
@Component({
  selector: 'landing-uses-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LandingIconArrowComponent],
  templateUrl: './uses-section.component.html',
  styleUrl: './uses-section.component.scss',
})
export class UsesSectionComponent {
  readonly section = input.required<UsesSection>();
}
