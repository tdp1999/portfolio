import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingIconArrowComponent } from '../icon';

export type ContentEntry = {
  readonly name: string;
  readonly monogram: string;
  readonly reason: string;
  readonly href?: string;
};

export type ContentSection = {
  readonly num: string;
  readonly id: string;
  readonly title: string;
  readonly entries: readonly ContentEntry[];
};

/**
 * Quiet-tone sub-page category block — monogram-tile mini-card grid under a
 * display-sm heading. Used on `/uses`, `/colophon`, and any future quiet
 * sub-page that lists named things with a one-line reason and optional link.
 *
 * Origin: DDL `uses-card-variants` V2 + S1 (locked 2026-05-16). Promoted to a
 * shared landing primitive when /colophon became a second consumer.
 *
 * Layout: 2-col responsive grid of mini-cards (monogram + name + reason).
 * Borders only (no box-shadow), indigo accent on hover, `prefers-reduced-motion`
 * honoured. Each section gets a fragment `id` for anchor linking.
 */
@Component({
  selector: 'landing-content-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LandingIconArrowComponent],
  templateUrl: './content-section.component.html',
  styleUrl: './content-section.component.scss',
})
export class LandingContentSectionComponent {
  readonly section = input.required<ContentSection>();
}
