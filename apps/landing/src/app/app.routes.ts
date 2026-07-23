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
    path: 'document-engine',
    loadComponent: () => import('./pages/document-engine/document-engine').then((m) => m.DocumentEngine),
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
    path: 'version',
    loadComponent: () => import('./pages/version/version').then((m) => m.Version),
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
    loadComponent: () => import('./pages/ddl/ddl-shell/ddl-shell').then((m) => m.DdlShell),
    loadChildren: () => import('./pages/ddl/ddl.routes').then((m) => m.DDL_ROUTES),
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
