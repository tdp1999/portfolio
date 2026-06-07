import { Route } from '@angular/router';
import { Projects } from './projects/projects';
import { ProjectDetail } from './project.detail/project.detail';
import { FeProjectsQueryAdapter, PROJECTS_QUERY_PORT } from '@portfolio/landing/shared/data-access';
import { LandingScrollspyService } from '@portfolio/landing/shared/ui';

export const PROJECTS_ROUTES: Route[] = [
  {
    path: '',
    component: Projects,
    providers: [{ provide: PROJECTS_QUERY_PORT, useClass: FeProjectsQueryAdapter }],
  },
  {
    path: ':slug',
    component: ProjectDetail,
    providers: [LandingScrollspyService],
  },
];
