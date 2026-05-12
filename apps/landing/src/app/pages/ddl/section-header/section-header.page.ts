import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  LandingSectionHeaderComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

type SectionPreview = {
  readonly id: string;
  readonly label: string;
  readonly note: string;
};

const SECTIONS: readonly SectionPreview[] = [
  {
    id: 's03',
    label: '§03 · Selected Work',
    note: 'Shipped — left-anchored. Heading sourced from Profile.selectedWorkIntro; BE-parses *word* into <em>. Project title font also switched to Newsreader (display).',
  },
  {
    id: 's04',
    label: '§04 · The Stack',
    note: 'Shipped 2026-05-12 — centered, no trailing period, fully centered groups (column + chip rows). ⚠️ Eyebrow + heading currently tautological ("THE STACK" / "toolkit") — see reframe candidates below.',
  },
  {
    id: 's05',
    label: '§05 · The Story',
    note: 'Currently eyebrow + trailingRule, no heading. Adding a visible heading is a new commitment.',
  },
  {
    id: 's06',
    label: '§06 · Get in Touch',
    note: 'Already has "Let\'s talk." in landing-heading. Promote to section-header with italic accent.',
  },
];

@Component({
  selector: 'landing-section-header-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingBreadcrumbComponent, LandingSectionHeaderComponent],
  template: `
    <div class="border-b border-landing-border bg-ink-1/60">
      <landing-container size="wide">
        <div class="py-6">
          <landing-breadcrumb [items]="breadcrumb" class="mb-4 block" />
          <landing-section-header align="left" size="sm">
            Section header — <em>cii</em> pattern propagation
          </landing-section-header>
          <p class="font-sans text-body-md text-landing-text-400 mt-4 max-w-3xl">
            New primitive <code>&lt;landing-section-header&gt;</code> = eyebrow + centered display heading with italic
            accent word(s) in <span class="text-landing-accent">indigo</span>. Same pattern as cii on
            <code>/ddl/stack</code>. The accent word is whatever you wrap in <code>&lt;em&gt;</code> — any position, any
            number of words. Aim for meaning-carriers, not connectors (skip <em>in</em>, <em>the</em>, <em>and</em>;
            favor verbs and nouns).
          </p>
        </div>
      </landing-container>
    </div>

    <!-- ═══ Primitive — use cases ══════════════════════════════════════ -->
    <section class="sh-block" aria-label="Primitive use cases">
      <landing-container size="wide">
        <landing-eyebrow
          [label]="['primitive', 'use cases', 'when each variant is for']"
          tone="accent"
          class="sh-block__eyebrow"
        />

        <div class="sh-block__grid">
          <div class="sh-card">
            <span class="sh-card__tag">home section · default</span>
            <span class="sh-card__use">md center + eyebrow · top-level home sections (§03–§06)</span>
            <landing-section-header [eyebrowLabel]="['04', 'The Stack']">
              The <em>toolkit</em>.
            </landing-section-header>
          </div>

          <div class="sh-card">
            <span class="sh-card__tag">interior · compact</span>
            <span class="sh-card__use"
              >sm center + eyebrow · sub-sections inside long-form pages (blog, projects detail)</span
            >
            <landing-section-header [eyebrowLabel]="['§', 'Process']" size="sm">
              How we <em>got here</em>.
            </landing-section-header>
          </div>

          <div class="sh-card">
            <span class="sh-card__tag">left-anchored · rare</span>
            <span class="sh-card__use"
              >md left + eyebrow · when section body is a single left-anchored column (no center column above it)</span
            >
            <landing-section-header [eyebrowLabel]="['§', 'Methods']" align="left">
              Tools, <em>plainly</em>.
            </landing-section-header>
          </div>

          <div class="sh-card">
            <span class="sh-card__tag">standalone page · no eyebrow</span>
            <span class="sh-card__use"
              >md center, no eyebrow · landing-style pages without §-numbering (uses, colophon)</span
            >
            <landing-section-header> What I <em>reach for</em>. </landing-section-header>
          </div>
        </div>
      </landing-container>
    </section>

    <!-- ═══ Per-section copy candidates ════════════════════════════════ -->
    <section class="sh-block sh-block--candidates" aria-label="Per-section candidates">
      <landing-container size="wide">
        <landing-eyebrow
          [label]="['home sections', 'candidate copy', 'pick a row']"
          tone="accent"
          class="sh-block__eyebrow"
        />
        <p class="sh-block__intro">
          Each section has candidates demoing where the accent can land — last word, middle word, multi-word phrase. §02
          (Who I Am) intentionally <strong>not here</strong>: it stays eyebrow-only — no display heading needed. §03 and
          §04 shipped. §05 + §06 pending. <br /><br />
          <strong>Avoid eyebrow / heading tautology</strong> — the eyebrow names the section ("THE STACK"), so the
          heading should add a different angle (verb-led action, outcome, register), not echo the same noun. §04
          currently has this issue ("THE STACK" + "toolkit"); reframe row below shows three escape paths.
        </p>

        @for (section of sections; track section.id) {
          <div class="sh-section">
            <div class="sh-section__head">
              <landing-eyebrow [label]="section.label" class="sh-section__eyebrow" />
              <p class="sh-section__note">{{ section.note }}</p>
            </div>

            @if (section.id === 's03') {
              <div class="sh-row sh-row--locked">
                <span class="sh-row__tag">shipped · left-anchored</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['03', 'Selected Work']" align="left">
                    Recent <em>work</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">accent variant · noun in middle</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['03', 'Selected Work']" align="left">
                    Shipped <em>in public</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">accent variant · verb-led phrase</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['03', 'Selected Work']" align="left">
                    <em>Built</em> and shipped.
                  </landing-section-header>
                </div>
              </div>
            }

            @if (section.id === 's04') {
              <div class="sh-row sh-row--locked">
                <span class="sh-row__tag">shipped · current</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['04', 'The Stack']">
                    The <em>toolkit</em>
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">reframe a · verb-led, daily-driver framing</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['04', 'The Stack']">
                    What I <em>reach for</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">reframe b · outcome-pointing</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['04', 'The Stack']">
                    Built with <em>these</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">reframe c · craft register</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['04', 'The Stack']">
                    Close to the <em>keyboard</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">reframe d · eyebrow renamed instead</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['04', 'Daily kit']">
                    The <em>toolkit</em>
                  </landing-section-header>
                </div>
              </div>
            }

            @if (section.id === 's05') {
              <div class="sh-row">
                <span class="sh-row__tag">a · single verb at end</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['05', 'The Story']">
                    How I <em>think</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">b · multi-word noun phrase</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['05', 'The Story']">
                    The <em>long arc</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">c · noun in middle (drop trailing word)</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['05', 'The Story']">
                    Where I <em>started</em>.
                  </landing-section-header>
                </div>
              </div>
            }

            @if (section.id === 's06') {
              <div class="sh-row">
                <span class="sh-row__tag">a · em the verb</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['06', 'Get in Touch']">
                    Let's <em>talk</em>.
                  </landing-section-header>
                </div>
              </div>
              <div class="sh-row">
                <span class="sh-row__tag">b · whole greeting as phrase</span>
                <div class="sh-row__body">
                  <landing-section-header [eyebrowLabel]="['06', 'Get in Touch']">
                    <em>Say hello</em>.
                  </landing-section-header>
                </div>
              </div>
            }
          </div>
        }
      </landing-container>
    </section>

    <!-- ═══ Adoption punch list ═════════════════════════════════════════ -->
    <div class="border-t border-landing-border">
      <landing-container size="wide">
        <div class="sh-summary">
          <landing-eyebrow
            [label]="['adoption', 'what swap looks like per section']"
            tone="accent"
            class="sh-summary__eyebrow"
          />

          <dl class="sh-cost">
            <div class="sh-cost__row">
              <dt class="sh-cost__key">§03 · WORK</dt>
              <dd class="sh-cost__val">
                <span class="sh-cost__scope">Shipped 2026-05-12</span>
                Uses <code>&lt;landing-section-header align="left"&gt;</code> with
                <code>&lt;landing-emphasis-text&gt;</code> parsing <code>*word*</code> markdown from
                <code>Profile.selectedWorkIntro</code>. Project title font also switched to Newsreader (display).
              </dd>
            </div>
            <div class="sh-cost__row">
              <dt class="sh-cost__key">§04 · STACK</dt>
              <dd class="sh-cost__val">
                <span class="sh-cost__scope">Shipped 2026-05-12 · pending reframe</span>
                Centered, fully center-aligned groups (column + chip rows). No trailing period in heading. Final copy
                "The toolkit" — flagged as eyebrow/heading tautology; see reframe candidates above.
              </dd>
            </div>
            <div class="sh-cost__row">
              <dt class="sh-cost__key">§05 · STORY</dt>
              <dd class="sh-cost__val">
                <span class="sh-cost__scope">Pending · net-new heading · 1 file</span>
                Replace eyebrow-only with section-header. Static copy.
              </dd>
            </div>
            <div class="sh-cost__row">
              <dt class="sh-cost__key">§06 · CONTACT</dt>
              <dd class="sh-cost__val">
                <span class="sh-cost__scope">Pending · promote existing · 1 file</span>
                Already has "Let's talk." via <code>landing-heading</code>. Swap to
                <code>&lt;landing-section-header&gt;</code> with italic accent word inline.
              </dd>
            </div>
          </dl>

          <p class="sh-summary__note">
            <strong>Status:</strong> §03 + §04 shipped. §05 + §06 still pending. §02 untouched (eyebrow-only is the
            right voice). Open question on §04 — pick a reframe variant before the tautology becomes a habit.
          </p>
        </div>
      </landing-container>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .sh-block {
        padding-block: 80px;
        border-block: 1px solid var(--landing-border);
      }
      .sh-block--candidates {
        background-color: var(--landing-ink-1);
      }
      .sh-block__eyebrow {
        display: block;
        margin-bottom: 24px;
      }
      .sh-block__intro {
        margin: 0 0 40px 0;
        max-width: 56rem;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .sh-block__intro code {
        font-family: var(--landing-font-mono);
        color: var(--landing-text-300);
      }
      .sh-block__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      @media (max-width: 768px) {
        .sh-block__grid {
          grid-template-columns: 1fr;
        }
      }

      .sh-card {
        position: relative;
        padding: 64px 32px 48px;
        background: var(--landing-ink-0);
        border: 1px solid var(--landing-border);
        border-radius: 4px;
      }
      .sh-card__tag {
        position: absolute;
        top: 12px;
        left: 16px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
      }
      .sh-card__use {
        display: block;
        position: absolute;
        top: 32px;
        left: 16px;
        right: 16px;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-500);
      }
      .sh-card {
        padding-top: 96px;
      }

      /* ─── Per-section candidate rows ─────────────────────────────── */
      .sh-section {
        padding-block: 40px;
        border-bottom: 1px solid var(--landing-border);
      }
      .sh-section:last-child {
        border-bottom: none;
      }
      .sh-section__head {
        margin-bottom: 24px;
      }
      .sh-section__eyebrow {
        display: block;
        margin-bottom: 4px;
      }
      .sh-section__note {
        margin: 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-500);
        max-width: 56rem;
      }
      .sh-row {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        padding: 32px 0;
        border-top: 1px dashed var(--landing-border);
      }
      .sh-row--locked {
        background-color: color-mix(in srgb, var(--landing-accent) 6%, transparent);
        padding-inline: 16px;
        border-radius: 4px;
      }
      .sh-row__tag {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
        padding-top: 8px;
      }
      .sh-row__body {
        background-color: var(--landing-ink-0);
        border: 1px solid var(--landing-border);
        border-radius: 4px;
        padding: 48px 32px;
      }
      @media (max-width: 768px) {
        .sh-row {
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .sh-row__body {
          padding: 32px 16px;
        }
      }

      /* ─── Summary cost table (reused pattern from stack page) ────── */
      .sh-summary {
        padding-block: 48px;
        max-width: 56rem;
        margin-inline: auto;
      }
      .sh-summary__eyebrow {
        display: block;
        margin-bottom: 24px;
      }
      .sh-cost {
        margin: 0;
        display: grid;
        gap: 20px;
      }
      .sh-cost__row {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 24px;
        padding-block: 16px;
        border-bottom: 1px solid var(--landing-border);
      }
      .sh-cost__row:last-child {
        border-bottom: none;
      }
      .sh-cost__key {
        margin: 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-300);
      }
      .sh-cost__val {
        margin: 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .sh-cost__scope {
        display: block;
        margin-bottom: 8px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
      }
      .sh-cost__val code {
        font-family: var(--landing-font-mono);
        color: var(--landing-text-300);
      }
      .sh-summary__note {
        margin: 32px 0 0 0;
        padding-top: 24px;
        border-top: 1px solid var(--landing-border);
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-500);
      }
      .sh-summary__note strong {
        color: var(--landing-text-300);
        font-weight: 600;
      }
      @media (max-width: 768px) {
        .sh-cost__row {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }
    `,
  ],
})
export class SectionHeaderPage {
  readonly sections = SECTIONS;
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Section header — cii propagation' },
  ];
}
