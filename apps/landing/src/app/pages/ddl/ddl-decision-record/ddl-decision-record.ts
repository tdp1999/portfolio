import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { DdlVariant } from '../ddl.types';

// The standardized decision marker (epic §2b — the headline of the docs
// convention). Given the variant list of an exploration page, it states the
// verdict in one scannable block: the ✓ Selected variant + its rationale, then
// the considered/rejected ones with their trade-offs. One widget, same shape on
// every variant page — replaces the five inconsistent prose phrasings.
@Component({
  selector: 'landing-ddl-decision-record',
  standalone: true,
  imports: [],
  templateUrl: './ddl-decision-record.html',
  styleUrl: './ddl-decision-record.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlDecisionRecord {
  readonly variants = input.required<readonly DdlVariant[]>();
  // One-line context shown under the header — the rationale for the selected
  // winner's omission, or what the page is still weighing while exploring.
  readonly summary = input<string>();

  protected readonly selected = computed(() => this.variants().find((v) => v.selected));
  protected readonly considered = computed(() => this.variants().filter((v) => !v.selected));
  // No winner yet → exploring mode: neutral header + "Candidate" tags instead of
  // an empty verdict block with every variant mislabelled "Considered".
  protected readonly exploring = computed(() => !this.selected());
}
