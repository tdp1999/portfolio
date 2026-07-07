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
    const title = 'Uses | Phuong Tran';
    const description = 'Hardware, editor, terminal, CLI, browser, and fonts I reach for daily.';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
  }
}
