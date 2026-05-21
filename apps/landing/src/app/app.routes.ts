import { Route } from '@angular/router';
import { FeatureHome } from '@portfolio/landing/feature-home';

export const appRoutes: Route[] = [
  {
    path: '',
    component: FeatureHome,
    pathMatch: 'full',
  },
  {
    path: 'experience',
    loadComponent: () => import('@portfolio/landing/feature-experience').then((m) => m.FeatureExperience),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/coming-soon/coming-soon.page').then((m) => m.ComingSoonPage),
    data: {
      section: 'About',
      blurb: "I'm shaping this section — voice, story, and what I'm about. It'll land here soon.",
    },
  },
  {
    path: 'projects',
    loadChildren: () => import('@portfolio/landing/feature-projects').then((m) => m.PROJECTS_ROUTES),
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/coming-soon/coming-soon.page').then((m) => m.ComingSoonPage),
    data: { section: 'Blog', blurb: "I'm drafting the first posts. Subscribe nowhere — just check back." },
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
        path: 'email-templates',
        loadComponent: () => import('./pages/ddl/email-templates').then((m) => m.EmailTemplatesPage),
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
