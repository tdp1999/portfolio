import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  Property,
  PropertyList,
  RecordEmptySections,
  RecordField,
  RecordFold,
  RecordItem,
  RecordLayout,
  RecordPanel,
  RecordSection,
  SegmentedControl,
  type SegmentedControlOption,
} from '@portfolio/console/shared/ui';

/**
 * DDL ANATOMY — detail page reference, rebuilt on the `console-record-*` family
 * (ADR-026). Shows one instance of every element a read view can carry: page
 * header with status + meta strip + overflow actions · L1 section holding L2
 * fields · L1 section holding L2 collection items · a collection item in both
 * expanded and collapsed (fold) form · the partial-data gap signal · a field
 * that exists only in the other locale · empty-sections disclosure · rail
 * panels (content language, properties, activity) · danger zone.
 *
 * For the behavioural study — full / partial / sparse records crossed with the
 * density switch and both locales — see `/ddl/detail-layouts`.
 */
@Component({
  selector: 'console-ddl-anatomy-detail',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    SegmentedControl,
    RecordLayout,
    RecordSection,
    RecordField,
    RecordItem,
    RecordFold,
    RecordPanel,
    PropertyList,
    Property,
    RecordEmptySections,
  ],
  templateUrl: './ddl-anatomy-detail.html',
  styleUrl: '../ddl-anatomy.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DdlAnatomyDetail {
  readonly locale = signal('en');
  readonly locales: SegmentedControlOption[] = [
    { value: 'en', label: 'EN' },
    { value: 'vi', label: 'VI' },
  ];

  readonly secondOpen = signal(false);
  readonly allOpen = signal(false);

  readonly emptySections = ['Media', 'Links'];

  readonly activity = [
    { who: 'Phuong Tran', what: 'changed status to Published', when: '2 days ago' },
    { who: 'Phuong Tran', what: 'edited the one-liner', when: '2 days ago' },
    { who: 'System', what: 'created the project', when: '3 weeks ago' },
  ];

  expandAll(): void {
    const next = !this.allOpen();
    this.allOpen.set(next);
    this.secondOpen.set(next);
  }
}
