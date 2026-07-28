import { Injectable, signal } from '@angular/core';
import type { InPageSection } from '@portfolio/landing/shared/ui';

import type { DdlDocWidth } from './ddl.types';

// Lets a /ddl child page hand its "on this page" sections (and its content-width
// request) up to the shell, which renders the shared right-hand TOC and sizes the
// content column. Provided by DdlShell so every child injects the same instance.
@Injectable()
export class DdlDocsService {
  private readonly sectionsSig = signal<readonly InPageSection[]>([]);
  readonly sections = this.sectionsSig.asReadonly();

  private readonly widthSig = signal<DdlDocWidth>('prose');
  readonly width = this.widthSig.asReadonly();

  publish(sections: readonly InPageSection[]): void {
    this.sectionsSig.set(sections);
  }

  setWidth(width: DdlDocWidth): void {
    this.widthSig.set(width);
  }

  clear(): void {
    this.sectionsSig.set([]);
    this.widthSig.set('prose');
  }
}
