import { Route, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FeatureHome } from '@portfolio/landing/feature-home';

// `/experience` redirects to `/about#experience`. Server-side `server.ts` issues
// a real 301 (with fragment) for direct loads & bots. This client-side variant
// only fires for in-app SPA navigation — kept as a defensive fallback since no
// internal link points at `/experience` after this epic.
const experienceRedirect = () => inject(Router).parseUrl('/about#experience');

export const appRoutes: Route[] = [
  {
    path: '',
    component: FeatureHome,
    pathMatch: 'full',
  },
  {
    path: 'about',
    loadComponent: () => import('@portfolio/landing/feature-about').then((m) => m.FeatureAbout),
  },
  {
    path: 'experience',
    pathMatch: 'full',
    redirectTo: experienceRedirect,
  },
  {
    path: 'projects',
    loadChildren: () => import('@portfolio/landing/feature-projects').then((m) => m.PROJECTS_ROUTES),
  },
  {
    path: 'blog',
    loadChildren: () => import('@portfolio/landing/feature-blog').then((m) => m.BLOG_ROUTES),
  },
  {
    path: 'uses',
    loadComponent: () => import('./pages/uses/uses.page').then((m) => m.UsesPage),
  },
  {
    path: 'colophon',
    loadComponent: () => import('./pages/colophon/colophon.page').then((m) => m.ColophonPage),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact').then((m) => m.ContactPage),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/legal/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/legal/terms.page').then((m) => m.TermsPage),
  },
  {
    path: 'ddl',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/ddl').then((m) => m.DdlComponent),
        pathMatch: 'full',
      },
      {
        path: 'fragment-navigation',
        loadComponent: () => import('./pages/ddl/fragment-navigation').then((m) => m.FragmentNavigationPage),
      },
      {
        path: 'backgrounds',
        loadComponent: () => import('./pages/ddl/backgrounds').then((m) => m.BackgroundsPage),
      },
      {
        path: 'bio-card-grid',
        loadComponent: () => import('./pages/ddl/bio-card-grid').then((m) => m.BioCardGridPage),
      },
      {
        path: 'bio-improvements',
        loadComponent: () => import('./pages/ddl/bio-improvements').then((m) => m.BioImprovementsPage),
      },
      {
        path: 'interactions',
        loadComponent: () => import('./pages/ddl/interactions').then((m) => m.InteractionsPage),
      },
      {
        path: 'hero-variants',
        loadComponent: () => import('./pages/ddl/hero-variants').then((m) => m.HeroVariantsPage),
      },
      {
        path: 'selected-work-transitions',
        loadComponent: () => import('./pages/ddl/selected-work-transitions').then((m) => m.SelectedWorkTransitionsPage),
      },
      {
        path: 'stack',
        loadComponent: () => import('./pages/ddl/stack').then((m) => m.StackPage),
      },
      {
        path: 'section-header',
        loadComponent: () => import('./pages/ddl/section-header').then((m) => m.SectionHeaderPage),
      },
      {
        path: 'page-hero',
        loadComponent: () => import('./pages/ddl/page-hero').then((m) => m.PageHeroPage),
      },
      {
        path: 'page-shell',
        loadComponent: () => import('./pages/ddl/page-shell').then((m) => m.PageShellPage),
      },
      {
        path: 'form-input',
        loadComponent: () => import('./pages/ddl/form-input').then((m) => m.FormInputPage),
      },
      {
        path: 'form-lib',
        loadComponent: () => import('./pages/ddl/form-lib').then((m) => m.FormLibPage),
      },
      {
        path: 'story-variants',
        loadComponent: () => import('./pages/ddl/story-variants').then((m) => m.StoryVariantsPage),
      },
      {
        path: 'philosophy-strip',
        loadComponent: () => import('./pages/ddl/philosophy-strip').then((m) => m.PhilosophyStripPage),
      },
      {
        path: 'get-in-touch',
        loadComponent: () => import('./pages/ddl/get-in-touch').then((m) => m.GetInTouchPage),
      },
      {
        path: 'feed-item-variants',
        loadComponent: () => import('./pages/ddl/feed-item-variants').then((m) => m.FeedItemVariantsPage),
      },
      {
        path: 'blog-list-variants',
        loadComponent: () => import('./pages/ddl/blog-list-variants').then((m) => m.BlogListVariantsPage),
      },
      {
        path: 'blog-detail-variants',
        loadComponent: () => import('./pages/ddl/blog-detail-variants').then((m) => m.BlogDetailVariantsPage),
      },
      {
        path: 'feed-filter-bar',
        loadComponent: () => import('./pages/ddl/feed-filter-bar').then((m) => m.FeedFilterBarPage),
      },
      {
        path: 'feed-pagination',
        loadComponent: () => import('./pages/ddl/feed-pagination').then((m) => m.FeedPaginationPage),
      },
      {
        path: 'project-detail-explore',
        loadComponent: () => import('./pages/ddl/project-detail-explore').then((m) => m.ProjectDetailExplorePage),
      },
      {
        path: 'prose-flow',
        loadComponent: () => import('./pages/ddl/prose-flow').then((m) => m.ProseFlowPage),
      },
      {
        path: 'uses-card-variants',
        loadComponent: () => import('./pages/ddl/uses-card-variants').then((m) => m.UsesCardVariantsPage),
      },
      {
        path: 'language-switcher',
        loadComponent: () => import('./pages/ddl/language-switcher').then((m) => m.LanguageSwitcherPage),
      },
      {
        path: 'command-palette',
        loadComponent: () => import('./pages/ddl/command-palette').then((m) => m.CommandPalettePage),
      },
      {
        path: 'mega-menu',
        loadComponent: () => import('./pages/ddl/mega-menu').then((m) => m.MegaMenuDdlPage),
      },
      {
        path: 'mobile-nav',
        loadComponent: () => import('./pages/ddl/mobile-nav').then((m) => m.MobileNavPage),
      },
      {
        path: 'scroll-edge-fade',
        loadComponent: () => import('./pages/ddl/scroll-edge-fade').then((m) => m.ScrollEdgeFadePage),
      },
      {
        path: 'carousel',
        loadComponent: () => import('./pages/ddl/carousel').then((m) => m.CarouselPage),
      },
      {
        path: 'lightbox',
        loadComponent: () => import('./pages/ddl/lightbox').then((m) => m.LightboxPage),
      },
      {
        path: 'show-more',
        loadComponent: () => import('./pages/ddl/show-more').then((m) => m.ShowMoreDdlPage),
      },
      {
        path: 'email-templates',
        loadComponent: () => import('./pages/ddl/email-templates').then((m) => m.EmailTemplatesPage),
      },
      {
        path: 'about-signatures',
        loadComponent: () => import('./pages/ddl/about-signatures').then((m) => m.DdlAboutSignaturesPage),
      },
    ],
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
