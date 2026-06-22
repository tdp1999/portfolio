import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Container, Link, PageShell, StatusDot } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import {
  BREADCRUMB_ABOUT,
  BREADCRUMB_PRIVACY,
  BREADCRUMB_USES,
  BREADCRUMB_CONTACT,
  SKELETON,
} from './ddl-page-shell.data';

/**
 * `/ddl/page-shell` — canonical structure showcase for every landing feature
 * page (subpage). Documents the four meta-strip variants and the shell's
 * structural contract: `<article>` > `<header>` (breadcrumb + page-hero +
 * optional meta) > `<section>` body blocks > optional `<footer>`.
 *
 * Per the DDL-as-sandbox rule, this page stays after migration — graduated
 * variants are marked inline.
 */
@Component({
  selector: 'landing-ddl-page-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, Link, StatusDot, RouterLink, DdlDocPage, DdlSection],
  template: `
    <landing-ddl-doc-page slug="page-shell" [width]="'wide'">
      <landing-ddl-section anchor="structural-contract" heading="Structural contract">
        <section class="psl__contract">
          <pre class="psl__code"><code>{{ skeleton }}</code></pre>
          <ul class="psl__rules" role="list">
            <li>One <code>&lt;h1&gt;</code> per page — emitted by <code>landing-page-hero</code> (level=1).</li>
            <li>Body <code>&lt;section&gt;</code>s use <code>aria-labelledby</code> + their own <code>&lt;h2&gt;</code>.</li>
            <li>Each body section owns its <code>landing-container</code> — width can differ per section.</li>
            <li><strong><code>align</code> controls the header only.</strong> Body content is always left-aligned regardless of header alignment — readability beats symmetry.</li>
            <li><strong>No eyebrow in the header.</strong> Page-shell intentionally drops eyebrow from feature pages; the breadcrumb already locates the page in the IA.</li>
            <li>Lede style (italic Newsreader, lede color) is owned by <code>landing-page-hero</code> — do not re-style.</li>
            <li>"Last updated" is always a <code>&lt;time datetime&gt;</code> for screen readers + <code>dateModified</code>.</li>
            <li>Shell renders the page's <code>&lt;article&gt;</code>. It MUST NOT render <code>&lt;main&gt;</code> — <code>landing-shell</code> already does.</li>
          </ul>
        </section>

      </landing-ddl-section>

      <!-- ═══ Variant A · About (composite, multi-meta strip) ═══════════ -->
      <landing-ddl-section anchor="variant-a-composite" heading="Variant A · Composite (about)">
        <article class="psl__variant">
          <header class="psl__variant-head">
            <p>
              Center-aligned hero, multi-fact <code>&lt;ul meta-strip&gt;</code> with a status dot. Body sections supply
              their own containers. Footer projects a final CTA.
            </p>
          </header>
          <div class="psl__stage">
            <landing-page-shell [breadcrumb]="bcAbout" align="center">
              <span hero-heading><em>About</em>.</span>
              <p hero-lede>Work history, principles, and what I am shipping now — informative, no filler.</p>
              <ul meta-strip role="list">
                <li>Ho Chi Minh City</li>
                <li>GMT+7</li>
                <li><landing-status-dot state="available" label="Open to work" variant="bare" /></li>
                <li>Updated <time datetime="2026-05-22">May 2026</time></li>
              </ul>

              <section aria-labelledby="psl-a-sec1">
                <landing-container>
                  <h2 id="psl-a-sec1" class="psl__demo-h2">How I think</h2>
                  <p class="psl__demo-p">First body section — owns its own container. Real page would set its own padding.</p>
                </landing-container>
              </section>

              <section aria-labelledby="psl-a-sec2">
                <landing-container>
                  <h2 id="psl-a-sec2" class="psl__demo-h2">Experience</h2>
                  <p class="psl__demo-p">Second body section — independent container size if needed.</p>
                </landing-container>
              </section>

              <div page-footer class="psl__demo-footer">
                <landing-container>
                  <a [routerLink]="['/']" class="psl__demo-cta">Get in touch →</a>
                </landing-container>
              </div>
            </landing-page-shell>
          </div>
        </article>

      </landing-ddl-section>

      <!-- ═══ Variant B · Privacy / Terms (long-form, last-updated only) ═ -->
      <landing-ddl-section anchor="variant-b-legal" heading="Variant B · Long-form legal">
        <article class="psl__variant">
          <header class="psl__variant-head">
            <p>
              Center hero, single-line <code>&lt;p meta-strip&gt;</code> with <code>&lt;time datetime&gt;</code>. No
              eyebrow (legal pages sit outside primary IA). Prose body constrained to ~70ch.
            </p>
          </header>
          <div class="psl__stage">
            <landing-page-shell [breadcrumb]="bcPrivacy" align="center">
              <span hero-heading>Privacy <em>Policy</em>.</span>
              <p hero-lede>What I collect, why, and how to ask me to remove it.</p>
              <p meta-strip>Last updated <time datetime="2026-05-22">22 May 2026</time>.</p>

              <section aria-labelledby="psl-b-sec1">
                <landing-container>
                  <div class="psl__prose">
                    <h2 id="psl-b-sec1" class="psl__demo-h2">What I collect</h2>
                    <p class="psl__demo-p">
                      Long-form prose lives in a width-constrained inner block (~70ch). The shell's container is
                      <code>content</code> (max-w-6xl); the inner <code>.psl__prose</code> narrows reading width.
                    </p>
                    <h2 id="psl-b-sec2" class="psl__demo-h2">Why I keep it</h2>
                    <p class="psl__demo-p">Multiple subsections still share one <code>&lt;section&gt;</code> here.</p>
                  </div>
                </landing-container>
              </section>
            </landing-page-shell>
          </div>
        </article>

      </landing-ddl-section>

      <!-- ═══ Variant C · Uses / Colophon (eyebrow + last-updated) ══════ -->
      <landing-ddl-section anchor="variant-c-catalogue" heading="Variant C · Indexed catalogue">
        <article class="psl__variant">
          <header class="psl__variant-head">
            <p>
              Center hero, <code>last-updated</code> meta line, body composed of independent
              <code>&lt;section&gt;</code> entries. No eyebrow — page-shell intentionally drops eyebrow from feature
              headers.
            </p>
          </header>
          <div class="psl__stage">
            <landing-page-shell [breadcrumb]="bcUses" align="center">
              <span hero-heading><em>Uses</em>.</span>
              <p hero-lede>What I reach for daily — the specific kit, not generic categories.</p>
              <p meta-strip>Last updated <time datetime="2026-05-22">22 May 2026</time>.</p>

              <section aria-labelledby="psl-c-sec1">
                <landing-container>
                  <h2 id="psl-c-sec1" class="psl__demo-h2">Editor</h2>
                  <p class="psl__demo-p">Catalogue body — each block its own <code>&lt;section&gt;</code>.</p>
                </landing-container>
              </section>

              <section aria-labelledby="psl-c-sec2">
                <landing-container>
                  <h2 id="psl-c-sec2" class="psl__demo-h2">Hardware</h2>
                  <p class="psl__demo-p">Independent labeling per section.</p>
                </landing-container>
              </section>
            </landing-page-shell>
          </div>
        </article>

      </landing-ddl-section>

      <!-- ═══ Variant D · Contact (left, no meta, form below) ══════════ -->
      <landing-ddl-section anchor="variant-d-contact" heading="Variant D · Talk-to-me (contact)">
        <article class="psl__variant">
          <header class="psl__variant-head">
            <p>
              Center hero, no meta strip (form is the surface). Body section hosts the form column + side channels.
              This is the page that historically diverged most — the shell makes it conform.
            </p>
          </header>
          <div class="psl__stage">
            <landing-page-shell [breadcrumb]="bcContact" align="center">
              <span hero-heading>Let's <em>talk</em>.</span>
              <p hero-lede>
                Full-time, freelance, collab, podcast — or just saying hi. I'll usually reply within a few days.
              </p>

              <section aria-labelledby="psl-d-sec1">
                <landing-container>
                  <h2 id="psl-d-sec1" class="psl__demo-h2 sr-only">Get in touch</h2>
                  <p class="psl__demo-p">[ form + channels grid would live here ]</p>
                </landing-container>
              </section>
            </landing-page-shell>
          </div>
        </article>

      </landing-ddl-section>

      <landing-ddl-section anchor="migration-status" heading="Migration status">
        <section class="psl__migration">
          <ul class="psl__rules" role="list">
            <li><code>landing-page-shell</code> shipped — exported from <code>@portfolio/landing/shared/ui</code>.</li>
            <li>
              Migrated callsites: <code>feature-about</code>, <code>contact.page</code>, <code>uses.page</code>,
              <code>colophon.page</code>, <code>privacy.page</code>, <code>terms.page</code>,
              <code>projects-page</code>, <code>not-found.page</code>.
            </li>
            <li>
              <strong>Documented exception:</strong> <code>project-detail</code> (case-study) keeps its bespoke
              3-column layout (left meta · middle reading · right TOC) — editorial IA differs from the canonical
              centered hero. Future blog-post detail may follow the same exception.
            </li>
            <li>See also <landing-link [routerLink]="['/ddl/page-hero']">page-hero</landing-link> for the inner heading composition.</li>
          </ul>
        </section>
      </landing-ddl-section>
    </landing-ddl-doc-page>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .psl__title {
        margin: 0 0 12px 0;
        font-family: var(--landing-font-body);
        font-weight: 700;
        font-size: var(--landing-display-md);
        line-height: var(--landing-display-md-lh);
        color: var(--landing-text-300);
      }
      .psl__lede {
        margin: 0 0 48px 0;
        max-width: 72ch;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .psl__lede code,
      .psl__rules code,
      .psl__variant-head code {
        font-family: var(--landing-font-mono);
        font-size: 0.92em;
        color: var(--landing-text-300);
      }
      .psl__h2 {
        margin: 0 0 12px 0;
        font-family: var(--landing-font-body);
        font-weight: 600;
        font-size: var(--landing-body-xl);
        line-height: var(--landing-body-xl-lh);
        color: var(--landing-text-300);
      }
      .psl__contract,
      .psl__migration {
        margin-bottom: 64px;
        padding: 24px;
        border: 1px dashed color-mix(in srgb, var(--landing-border) 60%, transparent);
        border-radius: 8px;
        background: color-mix(in srgb, var(--landing-surface-100) 30%, transparent);
      }
      .psl__code {
        margin: 0 0 20px 0;
        padding: 16px;
        background: var(--landing-surface-100);
        border-radius: 6px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 1.6;
        color: var(--landing-text-300);
        overflow-x: auto;
      }
      .psl__rules {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-400);
      }
      .psl__rules li {
        padding-left: 16px;
        position: relative;
      }
      .psl__rules li::before {
        content: '·';
        position: absolute;
        left: 0;
        color: var(--landing-text-600);
      }

      .psl__variant {
        margin-bottom: 64px;
        padding-bottom: 32px;
        border-bottom: 1px dashed color-mix(in srgb, var(--landing-border) 60%, transparent);
      }
      .psl__variant:last-child {
        border-bottom: none;
      }
      .psl__variant-head p {
        margin: 0 0 24px 0;
        max-width: 72ch;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-500);
      }
      .psl__stage {
        padding: 0;
        border: 1px dashed color-mix(in srgb, var(--landing-border) 60%, transparent);
        border-radius: 8px;
        background: color-mix(in srgb, var(--landing-surface-100) 20%, transparent);
        overflow: hidden;
      }

      /* Demo styles for stage body content — not part of the shell contract. */
      .psl__demo-h2 {
        margin: 0 0 8px 0;
        font-family: var(--landing-font-body);
        font-weight: 600;
        font-size: var(--landing-display-sm);
        line-height: var(--landing-display-sm-lh);
        color: var(--landing-text-300);
      }
      .psl__demo-p {
        margin: 0 0 16px 0;
        max-width: 70ch;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .psl__prose {
        max-width: 70ch;
      }
      .psl__demo-footer {
        padding: 48px 0 32px;
      }
      .psl__demo-cta {
        display: inline-block;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ],
})
export class DdlPageShell {
  // ── Properties ─────────────────────────────────────────────────────
  protected readonly bcAbout = BREADCRUMB_ABOUT;
  protected readonly bcPrivacy = BREADCRUMB_PRIVACY;
  protected readonly bcUses = BREADCRUMB_USES;
  protected readonly bcContact = BREADCRUMB_CONTACT;
  protected readonly skeleton = SKELETON;
}
