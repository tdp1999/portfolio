import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Chip, Eyebrow } from '@portfolio/landing/shared/ui';

import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { SKILLS, STACK_VARIANTS } from './ddl-stack.data';

@Component({
  selector: 'landing-ddl-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chip, Eyebrow, DdlDocPage, DdlSection, DdlDecisionRecord],
  template: `
    <landing-ddl-doc-page slug="stack" [width]="'wide'">
      <landing-ddl-decision-record
        [variants]="variants"
        [summary]="
          'Decided: tier grouping · action voice, brand-color icons (Iconify CDN here for prototype only; production uses MediaPicker upload), and the L3 effect (stagger only, no background, per the audit verdict to keep the quiet middle). Intro direction: shipped the interleave below to home §04, each paragraph woven with the tier it produced, keeping the full multi-paragraph prose. The single-tagline proposal and the three centred-intro takes are superseded by that pick, kept below as history.'
        "
      />

      <!-- ═══ Proposal: full section as currently composed ════════════════ -->
      <landing-ddl-section anchor="proposal" heading="Consolidated proposal">
        <section #proposal class="stk stk--proposal" aria-label="Proposal — full section composition">
          <button type="button" class="stk__replay" (click)="replay(proposal)" aria-label="Replay entrance animation">
            <span aria-hidden="true">↻</span>
            <span>replay entrance</span>
          </button>

          <landing-eyebrow [label]="['04', 'The Stack']" [accentFirst]="true" [trailingRule]="true" />

          <!-- intro slot — defaults to variant ci (eyebrow + tagline center). User picks final below. -->
          <div class="stk__intro stk__intro--ci">
            <p class="stk__tagline">What I reach for, daily.</p>
          </div>

          <div class="stk__tiers">
            <div class="stk__tier stk__tier--enter">
              <div class="stk__tier-head">
                <span class="stk__rule stk__rule--accent stk__rule--pulse" aria-hidden="true"></span>
                <landing-eyebrow label="Daily drivers" />
              </div>
              <ul class="stk__chips stk__chips--enter" role="list">
                @for (s of skills.daily; track s.name; let i = $index) {
                  <li [style.--stk-i]="i">
                    <landing-chip [label]="s.name" [iconUrl]="s.icon" size="lg" />
                  </li>
                }
              </ul>
            </div>

            <div class="stk__tier stk__tier--enter">
              <div class="stk__tier-head">
                <span class="stk__rule" aria-hidden="true"></span>
                <landing-eyebrow label="Frequent" />
              </div>
              <ul class="stk__chips stk__chips--enter" role="list">
                @for (s of skills.frequent; track s.name; let i = $index) {
                  <li [style.--stk-i]="i + 3">
                    <landing-chip [label]="s.name" [iconUrl]="s.icon" size="lg" />
                  </li>
                }
              </ul>
            </div>

            <div class="stk__tier stk__tier--enter">
              <div class="stk__tier-head">
                <span class="stk__rule stk__rule--muted" aria-hidden="true"></span>
                <landing-eyebrow label="Shipped with" />
              </div>
              <ul class="stk__chips stk__chips--enter" role="list">
                @for (s of skills.shipped; track s.name; let i = $index) {
                  <li [style.--stk-i]="i + 12">
                    <landing-chip [label]="s.name" [iconUrl]="s.icon" size="lg" />
                  </li>
                }
              </ul>
            </div>
          </div>
        </section>

        <div class="stk-notes">
          <p class="stk-notes__label">proposal · notes</p>
          <p class="stk-notes__text">
            Background: none (audit said adding a third pattern vocabulary breaks the home's quiet middle). Effect: L3
            stagger on chip entry (40ms cascade across the full rack so it reads as one wave), plus a quiet pulse on the
            accent rule next to the active tier. Reduced-motion users get the final state instantly. Chips use the new
            <code>landing-chip</code> <code>iconUrl</code> input + <code>size="lg"</code>. Hit replay to feel the
            entrance.
          </p>
        </div>

        <div class="stk-summary">
          <p class="stk-summary__label">icon strategy · production = mediapicker (single source)</p>
          <p class="stk-summary__intro">
            Production renders icons from <code>Skill.iconUrl</code> (FK to Media table, Cloudinary-hosted). Owner
            uploads SVG once per skill via the existing MediaPicker in the console — same pipeline as project images,
            avatars, every other asset. Zero dev coupling: adding "Rust" or "Bun" later is one upload, not a PR.
          </p>
          <ul class="stk-summary__list">
            <li>
              <strong>Why not bundled (simple-icons npm)?</strong> Creates a second source of truth alongside Media.
              Adding a skill would require a code change. Doesn't match existing arch.
            </li>
            <li>
              <strong>Why not CDN (Iconify)?</strong> External dependency, SSR FOUC, CSP cost. Used here in the DDL only
              because Cloudinary isn't seeded with icons yet.
            </li>
            <li>
              <strong>One-time setup cost:</strong> ~16 SVG uploads (download from simpleicons.org, drag into
              MediaPicker). Done once after BE chunk ships.
            </li>
          </ul>
          <p class="stk-summary__note">
            <strong>DDL prototype caveat:</strong> chips above use the Iconify CDN as a stand-in so you can feel the
            real visual. First paint may pop in 50–200ms as icons fetch from <code>api.iconify.design</code>. Production
            won't have this — Cloudinary URLs are stored in the rendered HTML at SSR time.
          </p>
        </div>
      </landing-ddl-section>

      <!-- ═══ Intro variants — center-aligned · pick one ═════════════════ -->
      <landing-ddl-section anchor="intros" heading="Center-aligned intro — three takes">
        <section class="stk stk--intros" aria-label="Center-aligned intro variants">
          <div class="stk__caption">
            <p class="stk__caption-label">intro · three center-aligned takes</p>
            <p class="stk__caption-hint">Same chip rack; only the intro changes</p>
          </div>

          <!-- ci · Eyebrow + tagline (no display heading) -->
          <div class="stk__variant">
            <div class="stk__variant-meta">
              <span class="stk__variant-tag">ci</span>
              <span class="stk__variant-desc">eyebrow + tagline, center · the proposal default</span>
            </div>
            <div class="stk__variant-body">
              <div class="stk__intro stk__intro--ci">
                <landing-eyebrow [label]="['04', 'The Stack']" [accentFirst]="true" />
                <p class="stk__tagline">What I reach for, daily.</p>
              </div>
              <div class="stk__sample-chips" aria-hidden="true">
                <landing-chip [label]="skills.daily[0].name" [iconUrl]="skills.daily[0].icon" size="lg" />
                <landing-chip [label]="skills.daily[1].name" [iconUrl]="skills.daily[1].icon" size="lg" />
                <landing-chip [label]="'+ 14 more'" size="lg" />
              </div>
            </div>
          </div>

          <!-- cii · Display heading center + italic accent -->
          <div class="stk__variant">
            <div class="stk__variant-meta">
              <span class="stk__variant-tag">cii</span>
              <span class="stk__variant-desc">display heading center + italic accent · editorial bookmark</span>
            </div>
            <div class="stk__variant-body">
              <div class="stk__intro stk__intro--cii">
                <landing-eyebrow [label]="['04', 'The Stack']" [accentFirst]="true" />
                <h2 class="stk__display">The <em class="stk__display-em">toolkit</em></h2>
              </div>
              <div class="stk__sample-chips" aria-hidden="true">
                <landing-chip [label]="skills.daily[0].name" [iconUrl]="skills.daily[0].icon" size="lg" />
                <landing-chip [label]="skills.daily[1].name" [iconUrl]="skills.daily[1].icon" size="lg" />
                <landing-chip [label]="'+ 14 more'" size="lg" />
              </div>
            </div>
          </div>

          <!-- ciii · Condensed tagline only (no eyebrow above) -->
          <div class="stk__variant">
            <div class="stk__variant-meta">
              <span class="stk__variant-tag">ciii</span>
              <span class="stk__variant-desc">condensed center · just one line, drop eyebrow</span>
            </div>
            <div class="stk__variant-body">
              <div class="stk__intro stk__intro--ciii">
                <p class="stk__tagline stk__tagline--lg">A small stack, kept <em class="stk__tagline-em">sharp</em>.</p>
              </div>
              <div class="stk__sample-chips" aria-hidden="true">
                <landing-chip [label]="skills.daily[0].name" [iconUrl]="skills.daily[0].icon" size="lg" />
                <landing-chip [label]="skills.daily[1].name" [iconUrl]="skills.daily[1].icon" size="lg" />
                <landing-chip [label]="'+ 14 more'" size="lg" />
              </div>
            </div>
          </div>
        </section>

        <div class="stk-notes">
          <p class="stk-notes__label">intro variants · pick a row</p>
          <p class="stk-notes__text">
            <strong>ci</strong> — most cohesive with the rest of the home (eyebrow stays consistent across sections).
            Quiet, leaves the chips to do the talking. <strong>cii</strong> — strongest editorial register, closest to
            the reference portfolio. Costs vertical space; pressures other sections to also display-heading.
            <strong>ciii</strong>
            — purest minimalism, drops the section number eyebrow entirely. Risks losing wayfinding (eyebrow is the
            "where am I" cue elsewhere on the page).
          </p>
        </div>
      </landing-ddl-section>

      <!-- ═══ Interleave — prose woven with tiers (exploration) ═══════════ -->
      <landing-ddl-section anchor="interleave" heading="Interleave — prose woven with tiers">
        <section class="stk stk--weave" aria-label="Interleave — one condensed paragraph per tier">
          <landing-eyebrow [label]="['04', 'The Stack']" [accentFirst]="true" [trailingRule]="true" />
          <h2 class="stk__display stk__display--weave">The <em class="stk__display-em">toolkit</em>.</h2>

          <div class="stk__weave">
            @for (beat of weave; track beat.tier.label) {
              <div class="stk__beat">
                <p class="stk__beat-prose">{{ beat.prose }}</p>
                <div class="stk__beat-tier">
                  <div class="stk__tier-head">
                    <span
                      class="stk__rule"
                      [class.stk__rule--accent]="beat.rule === 'accent'"
                      [class.stk__rule--muted]="beat.rule === 'muted'"
                      aria-hidden="true"
                    ></span>
                    <landing-eyebrow [label]="beat.tier.label" />
                  </div>
                  <ul class="stk__chips" role="list">
                    @for (s of beat.tier.skills; track s.name) {
                      <li>
                        <landing-chip [label]="s.name" [iconUrl]="s.icon" size="lg" />
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }
          </div>
        </section>

        <div class="stk-notes">
          <p class="stk-notes__label">interleave · shipped to home §04</p>
          <p class="stk-notes__text">
            <strong>Feasible, low cost.</strong> The consumed component pairs paragraph[i] with tier[i] by position — a
            single <code>computed</code> zips <code>parseInlineParagraphs(stackIntro)</code> against the tier groups. No
            schema change; the chip rack, eyebrow, and rules are the same primitives as the proposal above.
            <strong>The one coupling:</strong> paragraph count must track tier count (3 today). If they diverge, the
            component renders the shorter list paired and drops the leftover onto the end — so it degrades, it doesn't
            break. Prose here is placeholder; final copy is authored on prod via <code>Profile.stackIntro</code>. Left
            rule per beat ties each paragraph to the tools it produced (doubles as the "decoration" that breaks the wall
            of centred text).
          </p>
        </div>
      </landing-ddl-section>

      <!-- ═══ Implications punch list ═════════════════════════════════════ -->
      <landing-ddl-section anchor="punch-list" heading="BE / DB / console punch list">
        <div class="stk-summary">
          <p class="stk-summary__label">be / db / console — what these picks cost</p>
          <p class="stk-summary__intro">Total ~18 files across 3 features. UI ships first; BE follows.</p>

          <dl class="stk-cost">
            <div class="stk-cost__row">
              <dt class="stk-cost__key">TIER FIELD</dt>
              <dd class="stk-cost__val">
                <span class="stk-cost__scope">Medium · ~10 files</span>
                Prisma <code>Skill.tier</code> enum + 3-step migration (expand → backfill default
                <code>FREQUENT</code> → contract). Domain entity, DTO, mapper updated. Console skill-form gains a tier
                segmented control. FE <code>PublicSkill</code> type + new <code>getSkillsByTier()</code> method.
              </dd>
            </div>
            <div class="stk-cost__row">
              <dt class="stk-cost__key">PROSE</dt>
              <dd class="stk-cost__val">
                <span class="stk-cost__scope">Shipped · 3 files</span>
                Reuse <code>Profile.stackIntro</code> as-is: multi-paragraph, markdown emphasis kept. The home stack
                component zips each parsed paragraph with its tier by position (<code>beats()</code>). No schema or
                validation change; the author tightens the copy on prod.
              </dd>
            </div>
            <div class="stk-cost__row">
              <dt class="stk-cost__key">ICON PICKER</dt>
              <dd class="stk-cost__val">
                <span class="stk-cost__scope">Medium · 4–5 files</span>
                No schema change — <code>Skill.iconId</code> + <code>iconUrl</code> already wired to the Media pipeline.
                Console skill-form gains a MediaPicker dialog trigger for the icon slot. Iconify install for the 90%
                covered by Simple Icons / Logos; MediaPicker upload for the long tail.
              </dd>
            </div>
          </dl>

          <p class="stk-summary__note">
            <strong>Recommended ship order:</strong> (1) Update consumed home stack component to render new chip with
            icon — paint with stub iconUrls. (2) Tagline (smallest, unlocks intro copy). (3) Icon picker (reuse existing
            MediaPicker; high visual payoff). (4) Tier field (biggest; the schema change is the only blocker for the
            grouping switch, so do it last when you're committed).
          </p>
        </div>
      </landing-ddl-section>
    </landing-ddl-doc-page>
  `,
  styles: [
    `
      @use 'base/breakpoints' as bp;
      @use 'base/prefers' as prefers;

      :host {
        display: block;
      }

      .stk {
        position: relative;
        border-block: 1px solid var(--landing-border);
        padding-block: 96px;
        isolation: isolate;
      }
      .stk--intros {
        padding-block: 80px;
      }

      /* ─── Replay button ──────────────────────────────────────────── */
      .stk__replay {
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 3;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-500);
        background: transparent;
        border: 1px solid var(--landing-border);
        border-radius: 4px;
        cursor: pointer;
        transition:
          color 200ms ease,
          border-color 200ms ease;
      }
      .stk__replay:hover,
      .stk__replay:focus-visible {
        color: var(--landing-accent);
        border-color: var(--landing-accent);
        outline: none;
      }

      /* ─── Tier blocks ────────────────────────────────────────────── */
      .stk__tiers {
        display: grid;
        gap: 36px;
        margin-top: 40px;
      }
      .stk__tier-head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .stk__rule {
        display: block;
        height: 1px;
        width: 32px;
        background: var(--landing-border);
        flex: 0 0 32px;
      }
      .stk__rule--accent {
        background: var(--landing-accent);
      }
      .stk__rule--muted {
        background: color-mix(in srgb, var(--landing-border) 60%, transparent);
      }
      .stk__chips {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      /* ─── Intro · proposal default (ci) ──────────────────────────── */
      .stk__intro {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;
        margin: 32px auto 8px;
        max-width: 44rem;
      }
      .stk__intro--ci {
        gap: 12px;
      }
      .stk__intro--cii {
        gap: 16px;
      }
      .stk__intro--ciii {
        gap: 0;
      }
      .stk__tagline {
        margin: 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-xl);
        line-height: var(--landing-body-xl-lh);
        color: var(--landing-text-300);
      }
      .stk__tagline--lg {
        font-size: 32px;
        line-height: 40px;
      }
      .stk__tagline-em {
        font-family: var(--landing-font-display);
        font-style: italic;
        color: var(--landing-accent);
      }
      .stk__display {
        margin: 0;
        font-family: var(--landing-font-body);
        font-weight: 600;
        font-size: 56px;
        line-height: 64px;
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-text-300);
      }
      .stk__display-em {
        font-family: var(--landing-font-display);
        font-style: italic;
        font-weight: 400;
        color: var(--landing-accent);
      }

      /* ─── L3 entrance · stagger + tier pulse ─────────────────────── */
      .stk--proposal .stk__chips--enter > li {
        opacity: 0;
        transform: translateY(8px);
        animation: stk-chip-in 480ms cubic-bezier(0.2, 0, 0.1, 1) both;
        animation-delay: calc(var(--stk-i, 0) * 40ms + 120ms);
      }
      @keyframes stk-chip-in {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .stk--proposal .stk__tier--enter .stk__tier-head {
        opacity: 0;
        animation: stk-head-in 400ms cubic-bezier(0.2, 0, 0.1, 1) both;
      }
      .stk--proposal .stk__tier--enter:nth-child(1) .stk__tier-head {
        animation-delay: 60ms;
      }
      .stk--proposal .stk__tier--enter:nth-child(2) .stk__tier-head {
        animation-delay: 240ms;
      }
      .stk--proposal .stk__tier--enter:nth-child(3) .stk__tier-head {
        animation-delay: 660ms;
      }
      @keyframes stk-head-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .stk--proposal .stk__rule--pulse {
        animation: stk-pulse 2400ms ease-in-out infinite;
        animation-delay: 1400ms;
      }
      @keyframes stk-pulse {
        0%,
        100% {
          opacity: 1;
          transform: scaleX(1);
        }
        50% {
          opacity: 0.55;
          transform: scaleX(0.7);
        }
      }
      .stk--proposal .stk__chips--enter > li,
      .stk--proposal .stk__tier--enter .stk__tier-head {
        @include prefers.reduce-motion {
          opacity: 1;
          transform: none;
          animation: none;
        }
      }
      .stk--proposal .stk__rule--pulse {
        @include prefers.reduce-motion {
          animation: none;
        }
      }

      /* ─── Intro variants section ─────────────────────────────────── */
      .stk__caption {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--landing-border);
        margin-bottom: 40px;
      }
      .stk__caption-label {
        margin: 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
      }
      .stk__caption-hint {
        margin: 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-500);
      }
      .stk__variant {
        padding-block: 32px;
        border-bottom: 1px solid var(--landing-border);
      }
      .stk__variant:last-child {
        border-bottom: none;
      }
      .stk__variant-meta {
        display: flex;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 24px;
      }
      .stk__variant-tag {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
      }
      .stk__variant-desc {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-500);
      }
      .stk__variant-body {
        background-color: var(--landing-ink-1);
        border: 1px solid var(--landing-border);
        border-radius: 4px;
        padding: 48px 32px;
      }
      .stk__sample-chips {
        margin-top: 32px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
      }

      /* ─── Notes ──────────────────────────────────────────────────── */
      .stk-notes {
        padding-block: 32px;
        max-width: 56rem;
        margin-inline: auto;
      }
      .stk-notes__label {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
        margin: 0 0 8px 0;
      }
      .stk-notes__text {
        margin: 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .stk-notes__text strong {
        color: var(--landing-text-300);
      }

      .stk-summary {
        padding-block: 48px;
        max-width: 56rem;
        margin-inline: auto;
      }
      .stk-summary__label {
        margin: 0 0 12px 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
      }
      .stk-summary__intro {
        margin: 0 0 24px 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .stk-summary__list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .stk-summary__list strong {
        color: var(--landing-text-300);
        font-weight: 600;
        margin-right: 4px;
      }
      .stk-summary__note {
        margin: 32px 0 0 0;
        padding-top: 24px;
        border-top: 1px solid var(--landing-border);
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-500);
      }
      .stk-summary__note strong {
        color: var(--landing-text-300);
        font-weight: 600;
      }

      /* ─── Cost table ─────────────────────────────────────────────── */
      .stk-cost {
        margin: 0;
        display: grid;
        gap: 20px;
      }
      .stk-cost__row {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 24px;
        padding-block: 16px;
        border-bottom: 1px solid var(--landing-border);
      }
      .stk-cost__row:last-child {
        border-bottom: none;
      }
      .stk-cost__key {
        margin: 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-300);
      }
      .stk-cost__val {
        margin: 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .stk-cost__scope {
        display: block;
        margin-bottom: 8px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
      }
      .stk-cost__val code {
        font-family: var(--landing-font-mono);
        color: var(--landing-text-300);
      }

      /* ─── Interleave — prose woven with tiers ────────────────────── */
      .stk--weave .stk__display--weave {
        text-align: left;
        margin-top: 24px;
      }
      .stk__weave {
        display: grid;
        gap: 56px;
        max-width: 46rem;
        margin-top: 48px;
      }
      .stk__beat {
        display: grid;
        gap: 20px;
        padding-left: 24px;
        border-left: 1px solid var(--landing-border);
      }
      .stk__beat-prose {
        margin: 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-lg);
        line-height: var(--landing-body-lg-lh);
        color: var(--landing-text-300);
        text-align: left;
      }
      .stk__beat-tier {
        display: grid;
        gap: 12px;
      }
      .stk__beat-tier .stk__tier-head {
        margin-bottom: 0;
      }

      /* ─── Mobile ─────────────────────────────────────────────────── */
      @include bp.respond-down('tablet') {
        .stk {
          padding-block: 64px;
        }
        .stk--intros {
          padding-block: 48px;
        }
        .stk__display {
          font-size: 40px;
          line-height: 48px;
        }
        .stk__tagline--lg {
          font-size: 24px;
          line-height: 32px;
        }
        .stk__variant-body {
          padding: 32px 16px;
        }
        .stk__weave {
          gap: 40px;
          margin-top: 32px;
        }
        .stk__beat {
          padding-left: 16px;
        }
        .stk-cost__row {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }
    `,
  ],
})
export class DdlStack {
  // ── Properties ─────────────────────────────────────────────────────
  readonly skills = SKILLS;
  readonly variants = STACK_VARIANTS;

  /** Interleave exploration — one condensed paragraph paired with its tier.
   *  Prose is placeholder (final copy is authored on prod via Profile.stackIntro);
   *  the consumed component would zip paragraph[i] ↔ tier[i] by position. */
  readonly weave = [
    {
      rule: 'accent' as const,
      prose:
        'Most of my time writing code has been Angular. I started at the smallest steps and worked up to building the libraries other apps reuse.',
      tier: { label: 'Daily drivers', skills: SKILLS.daily },
    },
    {
      rule: 'plain' as const,
      prose:
        'That stretch shaped how I work: scale first, an architecture that holds under real problems. Wanting to understand the backend properly is how I drifted into NestJS.',
      tier: { label: 'Frequent', skills: SKILLS.frequent },
    },
    {
      rule: 'muted' as const,
      prose:
        'When AI arrived I did not stop at using it. I built my own workflow on top, tuned to how I actually work. This very site was planned, built, and shipped with it.',
      tier: { label: 'Shipped with', skills: SKILLS.shipped },
    },
  ];

  // ── Methods ────────────────────────────────────────────────────────
  protected replay(host: HTMLElement): void {
    const animations = host.getAnimations?.({ subtree: true });
    if (!animations) return;
    for (const a of animations) {
      a.cancel();
      a.play();
    }
  }
}
