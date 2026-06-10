import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Container, ContentSection, PageShell } from '@portfolio/landing/shared/ui';
import { BREADCRUMB, LAST_UPDATED, USES_SECTIONS } from './uses.data';

@Component({
  selector: 'landing-uses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, ContentSection],
  templateUrl: './uses.html',
  styleUrls: ['./uses.scss'],
})
export class Uses {
  // ──────── Injections ─────────────────────────────────────────────────
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  // ──────── Data ────────────────────────────────────────────────────────
  readonly breadcrumb = BREADCRUMB;
  readonly sections = USES_SECTIONS;
  readonly lastUpdated = LAST_UPDATED;

  // ──────── Constructor ─────────────────────────────────────────────────
  constructor() {
    this.title.setTitle('Uses | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Hardware, editor, terminal, CLI, browser, and fonts I reach for daily.',
    });
  }
}
