import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Container, Link, PageShell } from '@portfolio/landing/shared/ui';
import { BREADCRUMB } from './not-found.data';

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

  readonly breadcrumb = BREADCRUMB;

  constructor() {
    this.title.setTitle('Not found | Phuong Tran');
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }
}
