import { Route } from '@angular/router';

// DDL design-docs child routes. Mounted under `/ddl` (the shell) from app.routes.
// Kept out of app.routes so the app-level route table stays readable.
export const DDL_ROUTES: Route[] = [
  {
    path: '',
    loadComponent: () => import('./index').then((m) => m.Ddl),
    pathMatch: 'full',
  },

  // ── Components — primitives migrated to per-page docs ───────────────────
  {
    path: 'button',
    loadComponent: () => import('./ddl-button/ddl-button').then((m) => m.DdlButton),
  },
  {
    path: 'container',
    loadComponent: () => import('./ddl-container/ddl-container').then((m) => m.DdlContainer),
  },
  {
    path: 'tokens',
    loadComponent: () => import('./ddl-tokens/ddl-tokens').then((m) => m.DdlTokens),
  },
  {
    path: 'typography',
    loadComponent: () => import('./ddl-typography/ddl-typography').then((m) => m.DdlTypography),
  },
  {
    path: 'link',
    loadComponent: () => import('./ddl-link/ddl-link').then((m) => m.DdlLink),
  },
  {
    path: 'arrow',
    loadComponent: () => import('./ddl-arrow/ddl-arrow').then((m) => m.DdlArrow),
  },
  {
    path: 'chip',
    loadComponent: () => import('./ddl-chip/ddl-chip').then((m) => m.DdlChip),
  },
  {
    path: 'eyebrow',
    loadComponent: () => import('./ddl-eyebrow/ddl-eyebrow').then((m) => m.DdlEyebrow),
  },
  {
    path: 'status-dot',
    loadComponent: () => import('./ddl-status-dot/ddl-status-dot').then((m) => m.DdlStatusDot),
  },
  {
    path: 'figure',
    loadComponent: () => import('./ddl-figure/ddl-figure').then((m) => m.DdlFigure),
  },
  {
    path: 'pull-quote',
    loadComponent: () => import('./ddl-pull-quote/ddl-pull-quote').then((m) => m.DdlPullQuote),
  },
  {
    path: 'section-rule',
    loadComponent: () => import('./ddl-section-rule/ddl-section-rule').then((m) => m.DdlSectionRule),
  },
  {
    path: 'segmented',
    loadComponent: () => import('./ddl-segmented/ddl-segmented').then((m) => m.DdlSegmented),
  },
  {
    path: 'icon',
    loadComponent: () => import('./ddl-icon/ddl-icon').then((m) => m.DdlIcon),
  },
  {
    path: 'input',
    loadComponent: () => import('./ddl-input/ddl-input').then((m) => m.DdlInput),
  },
  {
    path: 'back-link',
    loadComponent: () => import('./ddl-back-link/ddl-back-link').then((m) => m.DdlBackLink),
  },
  {
    path: 'empty-state',
    loadComponent: () => import('./ddl-empty-state/ddl-empty-state').then((m) => m.DdlEmptyState),
  },
  {
    path: 'loading-spinner',
    loadComponent: () => import('./ddl-loading-spinner/ddl-loading-spinner').then((m) => m.DdlLoadingSpinner),
  },
  {
    path: 'router-progress',
    loadComponent: () => import('./ddl-router-progress/ddl-router-progress').then((m) => m.DdlRouterProgress),
  },
  {
    path: 'section-heading',
    loadComponent: () => import('./ddl-section-heading/ddl-section-heading').then((m) => m.DdlSectionHeading),
  },

  // ── Existing subroute pages ────────────────────────────────────────────
  {
    path: 'contrast',
    loadComponent: () => import('./ddl-contrast/ddl-contrast').then((m) => m.DdlContrast),
  },
  {
    path: 'fragment-navigation',
    loadComponent: () =>
      import('./ddl-fragment-navigation/ddl-fragment-navigation').then((m) => m.DdlFragmentNavigation),
  },
  {
    path: 'backgrounds',
    loadComponent: () => import('./ddl-backgrounds/ddl-backgrounds').then((m) => m.DdlBackgrounds),
  },
  {
    path: 'bio',
    loadComponent: () => import('./ddl-bio/ddl-bio').then((m) => m.DdlBio),
  },
  {
    path: 'interactions',
    loadComponent: () => import('./ddl-interactions/ddl-interactions').then((m) => m.DdlInteractions),
  },
  {
    path: 'hero',
    loadComponent: () => import('./ddl-hero/ddl-hero').then((m) => m.DdlHero),
  },
  {
    path: 'selected-work',
    loadComponent: () => import('./ddl-selected-work/ddl-selected-work').then((m) => m.DdlSelectedWork),
  },
  {
    path: 'stack',
    loadComponent: () => import('./ddl-stack/ddl-stack').then((m) => m.DdlStack),
  },
  {
    path: 'section-header',
    loadComponent: () => import('./ddl-section-header/ddl-section-header').then((m) => m.DdlSectionHeader),
  },
  {
    path: 'page-hero',
    loadComponent: () => import('./ddl-page-hero/ddl-page-hero').then((m) => m.DdlPageHero),
  },
  {
    path: 'page-shell',
    loadComponent: () => import('./ddl-page-shell/ddl-page-shell').then((m) => m.DdlPageShell),
  },
  {
    path: 'form-input',
    loadComponent: () => import('./ddl-form-input/ddl-form-input').then((m) => m.DdlFormInput),
  },
  {
    path: 'form-lib',
    loadComponent: () => import('./ddl-form-lib/ddl-form-lib').then((m) => m.DdlFormLib),
  },
  {
    path: 'story',
    loadComponent: () => import('./ddl-story/ddl-story').then((m) => m.DdlStory),
  },
  {
    path: 'philosophy-strip',
    loadComponent: () => import('./ddl-philosophy-strip/ddl-philosophy-strip').then((m) => m.DdlPhilosophyStrip),
  },
  {
    path: 'get-in-touch',
    loadComponent: () => import('./ddl-get-in-touch/ddl-get-in-touch').then((m) => m.DdlGetInTouch),
  },
  {
    path: 'feed-item',
    loadComponent: () => import('./ddl-feed-item/ddl-feed-item').then((m) => m.DdlFeedItem),
  },
  {
    path: 'blog-list',
    loadComponent: () => import('./ddl-blog-list/ddl-blog-list').then((m) => m.DdlBlogList),
  },
  {
    path: 'blog-detail',
    loadComponent: () => import('./ddl-blog-detail/ddl-blog-detail').then((m) => m.DdlBlogDetail),
  },
  {
    path: 'feed-filter-bar',
    loadComponent: () => import('./ddl-feed-filter-bar/ddl-feed-filter-bar').then((m) => m.DdlFeedFilterBar),
  },
  {
    path: 'feed-pagination',
    loadComponent: () => import('./ddl-feed-pagination/ddl-feed-pagination').then((m) => m.DdlFeedPagination),
  },
  {
    path: 'project-detail',
    loadComponent: () => import('./ddl-project-detail/ddl-project-detail').then((m) => m.DdlProjectDetail),
  },
  {
    path: 'prose-flow',
    loadComponent: () => import('./ddl-prose-flow/ddl-prose-flow').then((m) => m.DdlProseFlow),
  },
  {
    path: 'uses-card',
    loadComponent: () => import('./ddl-uses-card/ddl-uses-card').then((m) => m.DdlUsesCard),
  },
  {
    path: 'language-switcher',
    loadComponent: () => import('./ddl-language-switcher/ddl-language-switcher').then((m) => m.DdlLanguageSwitcher),
  },
  {
    path: 'command-palette',
    loadComponent: () => import('./ddl-command-palette/ddl-command-palette').then((m) => m.DdlCommandPalette),
  },
  {
    path: 'mega-menu',
    loadComponent: () => import('./ddl-mega-menu/ddl-mega-menu').then((m) => m.DdlMegaMenu),
  },
  {
    path: 'mobile-nav',
    loadComponent: () => import('./ddl-mobile-nav/ddl-mobile-nav').then((m) => m.DdlMobileNav),
  },
  {
    path: 'scroll-edge-fade',
    loadComponent: () => import('./ddl-scroll-edge-fade/ddl-scroll-edge-fade').then((m) => m.DdlScrollEdgeFade),
  },
  {
    path: 'carousel',
    loadComponent: () => import('./ddl-carousel/ddl-carousel').then((m) => m.DdlCarousel),
  },
  {
    path: 'lightbox',
    loadComponent: () => import('./ddl-lightbox/ddl-lightbox').then((m) => m.DdlLightbox),
  },
  {
    path: 'show-more',
    loadComponent: () => import('./ddl-show-more/ddl-show-more').then((m) => m.DdlShowMore),
  },
  {
    path: 'email-templates',
    loadComponent: () => import('./ddl-email-templates/ddl-email-templates').then((m) => m.DdlEmailTemplates),
  },
  {
    path: 'about-signatures',
    loadComponent: () => import('./ddl-about-signatures/ddl-about-signatures').then((m) => m.DdlAboutSignatures),
  },
  {
    path: 'identity',
    loadComponent: () => import('./ddl-identity/ddl-identity').then((m) => m.DdlIdentity),
  },
];
