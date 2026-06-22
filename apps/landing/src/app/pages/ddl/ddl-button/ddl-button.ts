import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Button, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, DdlDocPage, DdlSection],
  templateUrl: './ddl-button.html',
})
export class DdlButton {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-button variant="solid" size="md" arrow="right">
  Read more
</landing-button>`;
}
