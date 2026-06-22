import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PullQuote, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-pull-quote',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PullQuote, DdlDocPage, DdlSection],
  templateUrl: './ddl-pull-quote.html',
})
export class DdlPullQuote {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-pull-quote cite="Selected Work brief, 2026">
  A portfolio is not an inventory.
</landing-pull-quote>`;
}
