import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { SegmentedControl, type SegmentedControlOption } from '@portfolio/console/shared/ui';

/**
 * DDL ANATOMY — Detail page reference. Shows every detail-page element from the
 * audit: breadcrumbs + back · title + status badge + metadata strip · primary +
 * overflow actions · prev/next record nav · segmented content switch
 * (Overview / Activity / Related) · label-value fields · activity timeline ·
 * related records · timestamps footer · danger zone. Boxed, centered reading column.
 */
@Component({
  selector: 'console-ddl-anatomy-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, MatMenuModule, SegmentedControl],
  templateUrl: './ddl-anatomy-detail.html',
  styleUrl: '../ddl-anatomy.shared.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DdlAnatomyDetail {
  readonly tab = signal<'overview' | 'activity' | 'related'>('overview');
  readonly segments: SegmentedControlOption[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'activity', label: 'Activity' },
    { value: 'related', label: 'Related' },
  ];

  readonly activity = [
    { who: 'Phuong Tran', what: 'changed status to Published', when: '2 days ago' },
    { who: 'Phuong Tran', what: 'edited the one-liner', when: '2 days ago' },
    { who: 'System', what: 'created the project', when: '3 weeks ago' },
  ];

  readonly related = [
    { title: 'Document Engine', kind: 'Project' },
    { title: 'Angular', kind: 'Skill' },
    { title: 'Building for scale', kind: 'Blog post' },
  ];
}
