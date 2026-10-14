import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TRIAGE_TABS } from '../radar.data';
import type { RadarTriageStatus } from '../radar.types';

/** The Feed's Inbox / To try / Done tabs, each with its count under the current filters. */
@Component({
  selector: 'console-radar-triage-tabs',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './radar-triage.tabs.html',
  styleUrl: './radar-triage.tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarTriageTabs {
  readonly value = input.required<RadarTriageStatus>();
  /** Null until the first page loads; the counts then follow the filters. */
  readonly counts = input<Record<RadarTriageStatus, number> | null>(null);
  /** Icon and count only, for a phone toolbar; the label stays as the tab's name and tooltip. */
  readonly compact = input(false);
  readonly valueChange = output<RadarTriageStatus>();

  protected readonly tabs = TRIAGE_TABS;
}
