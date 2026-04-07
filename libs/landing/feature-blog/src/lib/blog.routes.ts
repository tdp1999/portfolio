import { Route } from '@angular/router';
import { BlogListPage } from './blog-list-page/blog-list-page';
import { BlogDetailPage } from './blog-detail-page/blog-detail-page';

export const BLOG_ROUTES: Route[] = [
  { path: '', component: BlogListPage },
  { path: ':slug', component: BlogDetailPage },
];
