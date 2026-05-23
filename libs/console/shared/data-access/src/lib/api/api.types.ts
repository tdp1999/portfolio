import { HttpContext } from '@angular/common/http';

export interface RequestOptions {
  params?: Record<string, string>;
  context?: HttpContext;
}
