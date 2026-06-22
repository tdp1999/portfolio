import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Chip, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chip, DdlDocPage, DdlSection],
  templateUrl: './ddl-chip.html',
  styleUrl: './ddl-chip.scss',
})
export class DdlChip {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'prototypes', title: 'Prototypes', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-chip label="Angular" />`;
}
