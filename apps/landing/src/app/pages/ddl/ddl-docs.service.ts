import { Injectable, signal } from '@angular/core';
import type { InPageSection } from '@portfolio/landing/shared/ui';

import type { DdlDocWidth } from './ddl.types';

// Lets a /ddl child page hand its "on this page" sections (and its content-width
// request) up to the shell, which renders the shared right-hand TOC and sizes the
// content column. Provided by DdlShell so every child injects the same instance.
@Injectable()
export class DdlDocsService {
  private readonly _sections = signal<readonly InPageSection[]>([]);
  readonly sections = this._sections.asReadonly();

  private readonly _width = signal<DdlDocWidth>('prose');
  readonly width = this._width.asReadonly();

  publish(sections: readonly InPageSection[]): void {
    this._sections.set(sections);
  }

  setWidth(width: DdlDocWidth): void {
    this._width.set(width);
  }

  clear(): void {
    this._sections.set([]);
    this._width.set('prose');
  }
}
