import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { Segmented, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { TABS_NO_PROTOTYPES, TABS_WITH_PROTOTYPES } from '../ddl.data';

@Component({
  selector: 'landing-ddl-segmented',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, Segmented],
  templateUrl: './ddl-segmented.html',
})
export class DdlSegmented {
  protected readonly tabsWithPrototypes = TABS_WITH_PROTOTYPES;
  protected readonly tabsNoPrototypes = TABS_NO_PROTOTYPES;

  protected readonly segDemoA = signal('showcase');
  protected readonly segDemoB = signal('showcase');
  protected readonly segDemoC = signal('s1');

  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'prototypes', title: 'Prototypes', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  protected readonly usageSnippet = `<landing-segmented
  [segments]="tabs"
  [active]="tab()"
  (activeChange)="tab.set($event)"
/>`;
}
