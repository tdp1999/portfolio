import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  ContainerComponent,
  LandingLinkComponent,
  LandingPageShellComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, LandingPageShellComponent, LandingLinkComponent],
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
})
export class NotFoundPage {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Not found · Phuong Tran');
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Not found' }];
}
