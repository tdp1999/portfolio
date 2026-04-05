import { Route } from '@angular/router';
import { ProjectsPage } from './projects-page/projects-page';
import { ProjectDetailComponent } from './project-detail/project-detail';

export const PROJECTS_ROUTES: Route[] = [
  { path: '', component: ProjectsPage },
  { path: ':slug', component: ProjectDetailComponent },
];
