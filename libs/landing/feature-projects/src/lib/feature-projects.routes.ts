import { Route } from '@angular/router';
import { ProjectsPage } from './projects-page/projects-page';
import { ProjectDetailComponent } from './project-detail/project-detail';
import { FeProjectsQueryAdapter, PROJECTS_QUERY_PORT } from '@portfolio/landing/shared/data-access';

export const PROJECTS_ROUTES: Route[] = [
  {
    path: '',
    component: ProjectsPage,
    providers: [{ provide: PROJECTS_QUERY_PORT, useClass: FeProjectsQueryAdapter }],
  },
  { path: ':slug', component: ProjectDetailComponent },
];
