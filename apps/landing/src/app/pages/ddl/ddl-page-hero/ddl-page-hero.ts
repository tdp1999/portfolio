import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHero } from '@portfolio/landing/shared/ui';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

/**
 * `/ddl/page-hero` — showcase + historical record for the `landing-page-hero`
 * primitive. Documents the variants in use across `/contact` (left, md),
 * `/uses` and `/colophon` (center, md), plus the size scale.
 *
 * Per the DDL-as-sandbox rule, this page stays even after primitives ship —
 * graduated entries are marked inline rather than deleted.
 */
@Component({
  selector: 'landing-ddl-page-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, PageHero],
  template: `
    <landing-ddl-doc-page slug="page-hero" [width]="'wide'">
      <p class="ph-ddl__lede">
        Canonical wrapper for child-page heroes (eyebrow + heading + lede). Used by
        <code>/contact</code> (left), <code>/uses</code> and <code>/colophon</code> (center). Inputs:
        <code>eyebrowLabel</code>, <code>align</code> (left | center), <code>size</code> (lg | md | sm),
        <code>accentFirst</code>. Heading content is projected — wrap accent words in <code>&lt;em&gt;</code> for
        italic-serif. The lede paragraph is projected via <code>[hero-lede]</code>.
      </p>

      <landing-ddl-section anchor="left-md" heading="Variant A · Left, md — picked for /contact">
        <p class="ph-ddl__note">Editorial voice. Used when the page invites a response (talk-to-me pages).</p>
        <div class="ph-ddl__stage">
          <landing-page-hero [eyebrowLabel]="['00', 'Contact']" align="left">
            Let's <em>talk</em>.
            <p hero-lede>
              Full-time, freelance, collab, podcast — or just saying hi. I'll usually reply within a few days.
            </p>
          </landing-page-hero>
        </div>
      </landing-ddl-section>

      <landing-ddl-section anchor="center-md" heading="Variant B · Center, md — picked for /uses + /colophon">
        <p class="ph-ddl__note">Indexed library voice. Used when the page is a structured catalogue.</p>
        <div class="ph-ddl__stage">
          <landing-page-hero [eyebrowLabel]="['01', 'Uses']" align="center">
            <em>Uses</em>.
            <p hero-lede>What I reach for daily — the specific kit, not generic categories.</p>
          </landing-page-hero>
        </div>
      </landing-ddl-section>

      <landing-ddl-section anchor="center-sm" heading="Variant C · Center, sm — for nested page heroes">
        <p class="ph-ddl__note">
          Reserve for sub-pages of sub-pages (e.g. a single project case study under <code>/projects/x</code>).
        </p>
        <div class="ph-ddl__stage">
          <landing-page-hero [eyebrowLabel]="['02', 'Case study']" align="center" size="sm">
            A <em>specific</em> project.
            <p hero-lede>The smaller scale reads as a chapter title, not a page title.</p>
          </landing-page-hero>
        </div>
      </landing-ddl-section>

      <landing-ddl-section anchor="left-lg" heading="Variant D · Left, lg — for stand-alone landing-style heroes">
        <p class="ph-ddl__note">Not currently used in production. Documented so the scale is visible.</p>
        <div class="ph-ddl__stage">
          <landing-page-hero [eyebrowLabel]="['§', 'Hero']" align="left" size="lg">
            A <em>big</em> hero.
            <p hero-lede>Reserve for marketing-style landing slots, not info-architecture child pages.</p>
          </landing-page-hero>
        </div>
      </landing-ddl-section>
    </landing-ddl-doc-page>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ph-ddl__lede {
        margin: 0;
        max-width: 64ch;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .ph-ddl__lede code {
        font-family: var(--landing-font-mono);
        font-size: 0.92em;
        color: var(--landing-text-300);
      }
      .ph-ddl__note {
        margin: 0 0 24px 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-500);
      }
      .ph-ddl__note code {
        font-family: var(--landing-font-mono);
        font-size: 0.92em;
        color: var(--landing-text-300);
      }
      .ph-ddl__stage {
        padding: 32px;
        border: 1px dashed color-mix(in srgb, var(--landing-border) 60%, transparent);
        border-radius: 8px;
        background: color-mix(in srgb, var(--landing-surface-100) 30%, transparent);
      }
    `,
  ],
})
export class DdlPageHero {}
