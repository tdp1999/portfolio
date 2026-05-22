import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { LandingPageShellComponent, type BreadcrumbItem } from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-feature-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LandingPageShellComponent],
  templateUrl: './feature-about.html',
  styleUrl: './feature-about.scss',
})
export class FeatureAbout {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('About | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Senior software engineer — work history, principles, and what I am shipping now.',
    });
  }

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'About' }];
}
