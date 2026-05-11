import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('@portfolio/landing/feature-home').then((m) => m.FeatureHome),
    pathMatch: 'full',
  },
  {
    path: 'experience',
    loadComponent: () => import('@portfolio/landing/feature-experience').then((m) => m.FeatureExperience),
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
    ],
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
