import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconArrow } from '../icon';
import type { ContentSectionData } from './content-section.types';

/**
 * Quiet-tone sub-page category block — monogram-tile mini-card grid under a
 * display-sm heading. Used on `/uses`, `/colophon`, and any future quiet
 * sub-page that lists named things with a one-line reason and optional link.
 *
 * Origin: DDL `uses-card` V2 + S1 (locked 2026-05-16). Promoted to a
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
  imports: [RouterLink, IconArrow],
  templateUrl: './content-section.html',
  styleUrl: './content-section.scss',
})
export class ContentSection {
  // ── Inputs ────────────────────────────────────────────────────────
  readonly section = input.required<ContentSectionData>();
}

export type { ContentEntry, ContentSectionData } from './content-section.types';
