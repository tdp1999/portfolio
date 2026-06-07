import { Route, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Home } from '@portfolio/landing/feature-home';

// `/experience` redirects to `/about#experience`. Server-side `server.ts` issues
// a real 301 (with fragment) for direct loads & bots. This client-side variant
// only fires for in-app SPA navigation — kept as a defensive fallback since no
// internal link points at `/experience` after this epic.
const experienceRedirect = () => inject(Router).parseUrl('/about#experience');

export const appRoutes: Route[] = [
  {
    path: '',
    component: Home,
    pathMatch: 'full',
  },
  {
    path: 'about',
    loadComponent: () => import('@portfolio/landing/feature-about').then((m) => m.About),
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
    loadComponent: () => import('./pages/uses/uses').then((m) => m.Uses),
  },
  {
    path: 'colophon',
    loadComponent: () => import('./pages/colophon/colophon').then((m) => m.Colophon),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact').then((m) => m.Contact),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/legal/privacy').then((m) => m.Privacy),
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/legal/terms').then((m) => m.Terms),
  },
  {
    path: 'ddl',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/ddl').then((m) => m.Ddl),
        pathMatch: 'full',
      },
      {
        path: 'contrast',
        loadComponent: () => import('./pages/ddl/ddl-contrast/ddl-contrast').then((m) => m.DdlContrast),
      },
      {
        path: 'fragment-navigation',
        loadComponent: () => import('./pages/ddl/fragment-navigation').then((m) => m.DdlFragmentNavigation),
      },
      {
        path: 'backgrounds',
        loadComponent: () => import('./pages/ddl/ddl-backgrounds/ddl-backgrounds').then((m) => m.DdlBackgrounds),
      },
      {
        path: 'bio-improvements',
        loadComponent: () =>
          import('./pages/ddl/ddl-bio-improvements/ddl-bio-improvements').then((m) => m.DdlBioImprovements),
      },
      {
        path: 'interactions',
        loadComponent: () => import('./pages/ddl/ddl-interactions/ddl-interactions').then((m) => m.DdlInteractions),
      },
      {
        path: 'hero-variants',
        loadComponent: () => import('./pages/ddl/ddl-hero-variants/ddl-hero-variants').then((m) => m.DdlHeroVariants),
      },
      {
        path: 'selected-work-transitions',
        loadComponent: () =>
          import('./pages/ddl/ddl-selected-work-transitions/ddl-selected-work-transitions').then(
            (m) => m.DdlSelectedWorkTransitions
          ),
      },
      {
        path: 'stack',
        loadComponent: () => import('./pages/ddl/ddl-stack/ddl-stack').then((m) => m.DdlStack),
      },
      {
        path: 'section-header',
        loadComponent: () =>
          import('./pages/ddl/ddl-section-header/ddl-section-header').then((m) => m.DdlSectionHeader),
      },
      {
        path: 'page-hero',
        loadComponent: () => import('./pages/ddl/ddl-page-hero/ddl-page-hero').then((m) => m.DdlPageHero),
      },
      {
        path: 'page-shell',
        loadComponent: () => import('./pages/ddl/ddl-page-shell/ddl-page-shell').then((m) => m.DdlPageShell),
      },
      {
        path: 'form-input',
        loadComponent: () => import('./pages/ddl/ddl-form-input/ddl-form-input').then((m) => m.DdlFormInput),
      },
      {
        path: 'form-lib',
        loadComponent: () => import('./pages/ddl/ddl-form-lib/ddl-form-lib').then((m) => m.DdlFormLib),
      },
      {
        path: 'story-variants',
        loadComponent: () =>
          import('./pages/ddl/ddl-story-variants/ddl-story-variants').then((m) => m.DdlStoryVariants),
      },
      {
        path: 'philosophy-strip',
        loadComponent: () =>
          import('./pages/ddl/ddl-philosophy-strip/ddl-philosophy-strip').then((m) => m.DdlPhilosophyStrip),
      },
      {
        path: 'get-in-touch',
        loadComponent: () => import('./pages/ddl/ddl-get-in-touch/ddl-get-in-touch').then((m) => m.DdlGetInTouch),
      },
      {
        path: 'feed-item-variants',
        loadComponent: () =>
          import('./pages/ddl/ddl-feed-item-variants/ddl-feed-item-variants').then((m) => m.DdlFeedItemVariants),
      },
      {
        path: 'blog-list-variants',
        loadComponent: () =>
          import('./pages/ddl/ddl-blog-list-variants/ddl-blog-list-variants').then((m) => m.DdlBlogListVariants),
      },
      {
        path: 'blog-detail-variants',
        loadComponent: () => import('./pages/ddl/blog-detail-variants').then((m) => m.DdlBlogDetailVariants),
      },
      {
        path: 'feed-filter-bar',
        loadComponent: () =>
          import('./pages/ddl/ddl-feed-filter-bar/ddl-feed-filter-bar').then((m) => m.DdlFeedFilterBar),
      },
      {
        path: 'feed-pagination',
        loadComponent: () =>
          import('./pages/ddl/ddl-feed-pagination/ddl-feed-pagination').then((m) => m.DdlFeedPagination),
      },
      {
        path: 'project-detail-explore',
        loadComponent: () =>
          import('./pages/ddl/ddl-project-detail-explore/ddl-project-detail-explore').then(
            (m) => m.DdlProjectDetailExplore
          ),
      },
      {
        path: 'prose-flow',
        loadComponent: () => import('./pages/ddl/ddl-prose-flow/ddl-prose-flow').then((m) => m.DdlProseFlow),
      },
      {
        path: 'uses-card-variants',
        loadComponent: () =>
          import('./pages/ddl/ddl-uses-card-variants/ddl-uses-card-variants').then((m) => m.DdlUsesCardVariants),
      },
      {
        path: 'language-switcher',
        loadComponent: () =>
          import('./pages/ddl/ddl-language-switcher/ddl-language-switcher').then((m) => m.DdlLanguageSwitcher),
      },
      {
        path: 'command-palette',
        loadComponent: () => import('./pages/ddl/command-palette').then((m) => m.DdlCommandPalette),
      },
      {
        path: 'mega-menu',
        loadComponent: () => import('./pages/ddl/ddl-mega-menu/ddl-mega-menu').then((m) => m.DdlMegaMenu),
      },
      {
        path: 'mobile-nav',
        loadComponent: () => import('./pages/ddl/ddl-mobile-nav/ddl-mobile-nav').then((m) => m.DdlMobileNav),
      },
      {
        path: 'scroll-edge-fade',
        loadComponent: () =>
          import('./pages/ddl/ddl-scroll-edge-fade/ddl-scroll-edge-fade').then((m) => m.DdlScrollEdgeFade),
      },
      {
        path: 'carousel',
        loadComponent: () => import('./pages/ddl/ddl-carousel/ddl-carousel').then((m) => m.DdlCarousel),
      },
      {
        path: 'lightbox',
        loadComponent: () => import('./pages/ddl/ddl-lightbox/ddl-lightbox').then((m) => m.DdlLightbox),
      },
      {
        path: 'show-more',
        loadComponent: () => import('./pages/ddl/ddl-show-more/ddl-show-more').then((m) => m.DdlShowMore),
      },
      {
        path: 'email-templates',
        loadComponent: () => import('./pages/ddl/email-templates').then((m) => m.DdlEmailTemplates),
      },
      {
        path: 'about-signatures',
        loadComponent: () => import('./pages/ddl/about-signatures').then((m) => m.DdlAboutSignatures),
      },
    ],
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
