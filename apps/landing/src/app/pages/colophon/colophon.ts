import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Container, ContentSection, PageShell, type BreadcrumbItem } from '@portfolio/landing/shared/ui';
import { COLOPHON_SECTIONS } from './colophon.data';

@Component({
  selector: 'landing-colophon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Container, PageShell, ContentSection],
  templateUrl: './colophon.html',
  styleUrls: ['./colophon.scss'],
})
export class Colophon {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Colophon' }];
  readonly sections = COLOPHON_SECTIONS;
  readonly lastUpdated = '2026-05';

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    const title = 'Colophon | Phuong Tran';
    const description = 'The stack, tools, and sources behind this site, credited honestly.';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
  }
}
