import { ChangeDetectionStrategy, Component } from '@angular/core';

import type { InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-typography',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection],
  templateUrl: './ddl-typography.html',
})
export class DdlTypography {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'voices', title: 'Three voices', level: 3 },
    { id: 'display-scale', title: 'Display scale', level: 3 },
    { id: 'body-scale', title: 'Body scale', level: 3 },
    { id: 'mono-scale', title: 'Mono scale', level: 3 },
    { id: 'pairing', title: 'Canonical pairing', level: 3 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];
}
