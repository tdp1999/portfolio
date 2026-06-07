import { Route } from '@angular/router';
import { BlogList } from './blog.list/blog.list';
import { BlogDetail } from './blog-detail-page/blog.detail';

export const BLOG_ROUTES: Route[] = [
  { path: '', component: BlogList },
  { path: ':slug', component: BlogDetail },
];
