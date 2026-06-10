import type { BreadcrumbItem } from '@portfolio/landing/shared/ui';

export const BREADCRUMB_ABOUT: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'About' }];
export const BREADCRUMB_PRIVACY: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Privacy' }];
export const BREADCRUMB_USES: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Uses' }];
export const BREADCRUMB_CONTACT: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Contact' }];

export const SKELETON = `<landing-page-shell [breadcrumb]="breadcrumb" align="center">
  <span hero-heading><em>About</em>.</span>
  <p hero-lede>One-sentence positioning.</p>
  <p meta-strip>Last updated <time datetime="2026-05-22">May 2026</time>.</p>

  <section aria-labelledby="exp-h">
    <landing-container>
      <h2 id="exp-h">Experience</h2>
      …
    </landing-container>
  </section>

  <div page-footer>
    <a routerLink="/contact">Get in touch →</a>
  </div>
</landing-page-shell>`;
