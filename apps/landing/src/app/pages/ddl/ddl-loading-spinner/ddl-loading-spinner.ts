import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LoadingSpinner, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, LoadingSpinner],
  templateUrl: './ddl-loading-spinner.html',
})
export class DdlLoadingSpinner {
  protected readonly sections: readonly InPageSection[] = [{ id: 'showcase', title: 'Showcase', level: 2 }];

  protected readonly loadingSnippet = `@if (resource.showSpinner()) {
  <landing-loading-spinner message="Loading projects…" />
} @else if (resource.isEmpty()) {
  <landing-empty-state ... />
} @else {
  <!-- content -->
}`;
}
