import { ChangeDetectionStrategy, Component } from '@angular/core';

import { StatusDot, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-status-dot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusDot, DdlDocPage, DdlSection],
  templateUrl: './ddl-status-dot.html',
  styleUrl: './ddl-status-dot.scss',
})
export class DdlStatusDot {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'prototypes', title: 'Prototypes', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-status-dot state="available" label="Available for work" ariaLabel="..." />`;
}
