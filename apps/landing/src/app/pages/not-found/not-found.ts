import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Container, Link, PageShell, type BreadcrumbItem } from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, Link],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss'],
})
export class NotFound {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Not found' }];

  constructor() {
    this.title.setTitle('Not found · Phuong Tran');
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }
}
