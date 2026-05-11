import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  LandingBackgroundComponent,
  LandingBreadcrumbComponent,
  StaggerCharsDirective,
  StatusDotComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

const DEMO = {
  fullName: 'Phuong Tran',
  role: 'Senior Frontend Engineer',
  lead: 'Four years shipping fintech tools for the Singapore market.',
  emphasis: 'Document engines, loan systems, permission frameworks.',
  status: 'AVAILABLE FOR HIRE',
  stack: 'ANGULAR / TYPESCRIPT / ANGULAR MATERIAL',
  city: 'HO CHI MINH CITY',
} as const;

@Component({
  selector: 'landing-hero-variants-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ContainerComponent,
    LandingBackgroundComponent,
    LandingBreadcrumbComponent,
    StaggerCharsDirective,
    StatusDotComponent,
  ],
  template: `
    <div class="border-b border-landing-border bg-ink-1/60">
      <landing-container size="wide">
        <div class="py-6">
          <landing-breadcrumb [items]="breadcrumb" class="mb-3 block" />
          <h1 class="font-display text-display-md text-landing-text-300">Hero direction variants</h1>
          <p class="font-sans text-body-md text-landing-text-400 mt-2 max-w-2xl">
            <strong class="text-landing-text-300">α picked.</strong> Graduated to <code>landing-home-hero</code> with
            <code>fxStaggerChars</code>. The spotlight (<code>fxSpotlight scope="viewport"</code>) is now applied once
            on <code>landing-shell</code> — follows the cursor across every page, theme-aware (white tint on dark, slate
            tint on light). β / γ kept for visual reference; safe to delete next sweep.
          </p>
        </div>
      </landing-container>
    </div>

    <!-- ═══ V1 — Anchor (kept as safe fallback) ════════════════════════ -->
    <section #v1 class="hv hv--v1" aria-label="V1: Anchor, committed (fallback)">
      <button type="button" class="hv__replay" (click)="replay(v1)" aria-label="Replay V1 entrance">
        <span aria-hidden="true">↻</span>
        <span>replay entrance</span>
      </button>
      <landing-background pattern="blueprint" />
      <landing-container size="wide" class="hv__top">
        <div class="hv__headline">
          <h2 class="hv__title hv--v1-title">
            <span class="hv__title-name">{{ demo.fullName }}</span>
            <span class="hv__title-dash">— {{ demo.role }}</span>
          </h2>
          <p class="hv__sub-lead">{{ demo.lead }}</p>
          <p class="hv__sub-emphasis">{{ demo.emphasis }}</p>
        </div>
      </landing-container>
      <landing-container size="wide" class="hv__bottom">
        <ng-container *ngTemplateOutlet="meta" />
      </landing-container>
    </section>
    <landing-container size="wide">
      <div class="hv-notes">
        <p class="hv-notes__label">v1 · anchor (fallback)</p>
        <p class="hv-notes__text">
          Safe entrance fade-up, 96px H1, full-bleed blueprint. Kept as the conservative default — useful as a baseline
          when a richer variant feels too risky on the day of ship.
        </p>
      </div>
    </landing-container>

    <!-- ═══ V2 — No entrance (spotlight is now system-wide via landing-shell) ═══ -->
    <section #v2 class="hv hv--v2" aria-label="V2: No entrance, system spotlight">
      <landing-background pattern="blueprint" />
      <landing-container size="wide" class="hv__top">
        <div class="hv__headline">
          <h2 class="hv__title hv--v1-title">
            <span class="hv__title-name">{{ demo.fullName }}</span>
            <span class="hv__title-dash">— {{ demo.role }}</span>
          </h2>
          <p class="hv__sub-lead">{{ demo.lead }}</p>
          <p class="hv__sub-emphasis">{{ demo.emphasis }}</p>
        </div>
      </landing-container>
      <landing-container size="wide" class="hv__bottom">
        <ng-container *ngTemplateOutlet="meta" />
      </landing-container>
    </section>
    <landing-container size="wide">
      <div class="hv-notes">
        <p class="hv-notes__label">v2 · no entrance (system spotlight)</p>
        <p class="hv-notes__text">
          The spotlight is now applied once at <code>landing-shell</code> (<code>scope="viewport"</code>) and follows
          the cursor across every page — including this section. V2 here just shows "no entrance" as the alternative
          pacing. Move your mouse anywhere on the site to feel it. Light theme: dark slate tint; dark theme: white tint.
        </p>
      </div>
    </landing-container>

    <!-- ═══ α — Settled stagger ════════════════════════════════════════ -->
    <section #alpha class="hv hv--alpha" aria-label="α: Settled stagger">
      <button type="button" class="hv__replay" (click)="replay(alpha)" aria-label="Replay α entrance">
        <span aria-hidden="true">↻</span>
        <span>replay entrance</span>
      </button>
      <landing-background pattern="blueprint" />
      <landing-container size="wide" class="hv__top">
        <div class="hv__headline">
          <h2 class="hv__title hv--alpha-title" fxStaggerChars [attr.aria-label]="demo.fullName">
            {{ demo.fullName }}
          </h2>
          <p class="hv--alpha-dash">— {{ demo.role }}</p>
          <p class="hv__sub-lead hv--alpha-lead">{{ demo.lead }}</p>
          <p class="hv__sub-emphasis hv--alpha-emphasis">{{ demo.emphasis }}</p>
        </div>
      </landing-container>
      <landing-container size="wide" class="hv__bottom">
        <ng-container *ngTemplateOutlet="meta" />
      </landing-container>
    </section>
    <landing-container size="wide">
      <div class="hv-notes">
        <p class="hv-notes__label">α · settled stagger</p>
        <p class="hv-notes__text">
          Per-character: each letter rises from a small randomized Y offset, 22ms stagger, snappier ease-out. Removed
          blur (caused dim end state on some GPUs). Role uses clip-path inset reveal sweep after the name settles.
          Crafted, "human-typed" — not algorithmic. Reference: Studio Output, Vasyl Tymoshchuk.
        </p>
      </div>
    </landing-container>

    <!-- ═══ β — Marquee in ═════════════════════════════════════════════ -->
    <section #beta class="hv hv--beta" aria-label="β: Marquee in">
      <button type="button" class="hv__replay" (click)="replay(beta)" aria-label="Replay β entrance">
        <span aria-hidden="true">↻</span>
        <span>replay entrance</span>
      </button>
      <landing-background pattern="blueprint" />
      <landing-container size="wide" class="hv__top">
        <div class="hv__headline">
          <h2 class="hv--beta-title">
            <span class="hv--beta-name">{{ demo.fullName }}</span>
            <span class="hv--beta-dash-row">
              <span class="hv--beta-rule" aria-hidden="true"></span>
              <span class="hv--beta-role">{{ demo.role }}</span>
            </span>
          </h2>
          <p class="hv__sub-lead hv--beta-lead">{{ demo.lead }}</p>
          <p class="hv__sub-emphasis hv--beta-emphasis">{{ demo.emphasis }}</p>
        </div>
      </landing-container>
      <landing-container size="wide" class="hv__bottom">
        <ng-container *ngTemplateOutlet="meta" />
      </landing-container>
    </section>
    <landing-container size="wide">
      <div class="hv-notes">
        <p class="hv-notes__label">β · cross-axis (smoothed)</p>
        <p class="hv-notes__text">
          Smoothed: travel reduced (-800px → -240px) and easing flipped from ink-bleed (was jerky) to expo-out. Name
          slides from left, em-dash hairline draws in, role italic enters from right (gentler 120px). Compositional, not
          "fade all". Reference: Pentagram launches, A24 sites.
        </p>
      </div>
    </landing-container>

    <!-- ═══ γ — Diagonal mask wipe ═════════════════════════════════════ -->
    <section #gamma class="hv hv--gamma" aria-label="γ: Diagonal mask wipe">
      <button type="button" class="hv__replay" (click)="replay(gamma)" aria-label="Replay γ entrance">
        <span aria-hidden="true">↻</span>
        <span>replay entrance</span>
      </button>
      <landing-background pattern="blueprint" />
      <landing-container size="wide" class="hv__top">
        <div class="hv__headline">
          <h2 class="hv--gamma-title">
            <span class="hv--gamma-name">{{ demo.fullName }}</span>
            <span class="hv--gamma-dash-row">
              <span class="hv--gamma-rule" aria-hidden="true"></span>
              <span class="hv--gamma-role">{{ demo.role }}</span>
            </span>
          </h2>
          <p class="hv__sub-lead hv--gamma-lead">{{ demo.lead }}</p>
          <p class="hv__sub-emphasis hv--gamma-emphasis">{{ demo.emphasis }}</p>
        </div>
      </landing-container>
      <landing-container size="wide" class="hv__bottom">
        <ng-container *ngTemplateOutlet="meta" />
      </landing-container>
    </section>
    <landing-container size="wide">
      <div class="hv-notes">
        <p class="hv-notes__label">γ · diagonal mask wipe</p>
        <p class="hv-notes__text">
          H1 hidden under a 135° linear-gradient mask with a soft edge — letters fade in as the wipe sweeps diagonally
          across. After the name settles, the em-dash strokes in as a 1px hairline rule, then the role fades up.
          Editorial / print sequencing. Reference: It's Nice That, Common Sans.
        </p>
      </div>
    </landing-container>

    <!-- ═══ Summary ════════════════════════════════════════════════════ -->
    <div class="border-t border-landing-border">
      <landing-container size="wide">
        <div class="hv-summary">
          <p class="hv-notes__label">how to pick</p>
          <ul class="hv-summary__list">
            <li><strong>α</strong> → live in <code>landing-home-hero</code> via <code>fxStaggerChars</code>.</li>
            <li>
              <strong>Spotlight</strong> → site-wide via <code>fxSpotlight scope="viewport"</code> on
              <code>landing-shell</code>. Theme-aware.
            </li>
            <li>
              <strong>fxStaggerChars</strong> — per-character entrance. SSR-safe. Inputs: <code>charDelay</code>,
              <code>duration</code>.
            </li>
            <li>
              <strong>fxSpotlight</strong> — cursor-tracking overlay. Inputs: <code>radius</code>,
              <code>intensity</code>, <code>scope</code> (host | viewport).
            </li>
            <li><strong>V1 / β / γ</strong> — exploration debris. Safe to delete next sweep.</li>
          </ul>
          <p class="hv-summary__note">
            Library: <code>libs/landing/shared/ui/src/motion/</code> — one folder per effect, each with a directive file
            and an scss file. New effects: add a folder, append to <code>_motion.scss</code>, export from
            <code>index.ts</code>. Stylesheets auto-load via <code>styles/index.scss</code>.
          </p>
        </div>
      </landing-container>
    </div>

    <!-- Shared meta block — used by V1, V2, α, β, γ -->
    <ng-template #meta>
      <dl class="hv__meta" aria-label="Hire status">
        <div class="hv__meta-row">
          <dt class="hv__meta-key">STATUS</dt>
          <dd class="hv__meta-val">
            <landing-status-dot variant="bare" state="available" [label]="demo.status" ariaLabel="Hiring status" />
          </dd>
        </div>
        <div class="hv__meta-row">
          <dt class="hv__meta-key">CORE STACK</dt>
          <dd class="hv__meta-val hv__meta-val--mono">{{ demo.stack }}</dd>
        </div>
        <div class="hv__meta-row">
          <dt class="hv__meta-key">LOCATION</dt>
          <dd class="hv__meta-val hv__meta-val--mono">{{ demo.city }}</dd>
        </div>
      </dl>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ─── Shared scaffolding ─────────────────────────────────────── */
      .hv {
        position: relative;
        min-height: calc(100vh - 80px);
        display: flex;
        flex-direction: column;
        padding-block: 96px;
        overflow: hidden;
        isolation: isolate;
        border-block: 1px solid var(--landing-border);
      }
      .hv__top {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .hv__bottom {
        display: block;
      }
      .hv__headline {
        text-align: left;
        max-width: 56rem;
        margin-inline: auto;
      }

      /* Shared big title (V1, V2, δ) */
      .hv--v1-title {
        margin: 0;
        font-size: 96px;
        line-height: 104px;
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-text-300);
      }
      .hv__title-name,
      .hv__title-dash {
        display: block;
      }
      .hv__title-name {
        font-family: var(--landing-font-body);
        font-weight: 600;
      }
      .hv__title-dash {
        font-family: var(--landing-font-display);
        font-style: italic;
        font-weight: 400;
        color: var(--landing-accent);
        margin-top: 4px;
        padding-bottom: 12px;
        font-size: 64px;
        line-height: 72px;
      }

      .hv__sub-lead,
      .hv__sub-emphasis {
        margin: 0;
        max-width: 42rem;
        font-size: var(--landing-body-lg);
        line-height: var(--landing-body-lg-lh);
      }
      .hv__sub-lead {
        margin-top: 32px;
        font-family: var(--landing-font-body);
        color: var(--landing-text-400);
      }
      .hv__sub-emphasis {
        margin-top: 8px;
        font-family: var(--landing-font-display);
        font-style: italic;
        color: var(--landing-accent);
      }

      .hv__meta {
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        text-align: right;
      }
      .hv__meta-row {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;
      }
      .hv__meta-key {
        margin: 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-500);
      }
      .hv__meta-val {
        margin: 0;
        display: inline-flex;
        align-items: center;
        color: var(--landing-text-300);
      }
      .hv__meta-val--mono {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
      }

      /* ─── V1 — Anchor, full-bleed blueprint + entrance ───────────── */
      .hv--v1 ::ng-deep .landing-bg--blueprint::before,
      .hv--v2 ::ng-deep .landing-bg--blueprint::before,
      .hv--alpha ::ng-deep .landing-bg--blueprint::before,
      .hv--beta ::ng-deep .landing-bg--blueprint::before,
      .hv--gamma ::ng-deep .landing-bg--blueprint::before {
        opacity: 0.32;
        height: 200%;
        bottom: -40%;
        mask-image: radial-gradient(ellipse 90% 100% at 50% 100%, black 30%, transparent 88%);
        -webkit-mask-image: radial-gradient(ellipse 90% 100% at 50% 100%, black 30%, transparent 88%);
      }

      .hv--v1 ::ng-deep .landing-bg--blueprint::before {
        animation: hv-grid-fade-in 1400ms cubic-bezier(0.2, 0, 0, 1) both;
      }
      .hv--v1 .hv--v1-title {
        animation: hv-fade-up 900ms cubic-bezier(0.2, 0, 0, 1) 100ms both;
      }
      .hv--v1 .hv__sub-lead {
        animation: hv-fade-up 800ms cubic-bezier(0.2, 0, 0, 1) 320ms both;
      }
      .hv--v1 .hv__sub-emphasis {
        animation: hv-fade-up 800ms cubic-bezier(0.2, 0, 0, 1) 440ms both;
      }
      @keyframes hv-grid-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 0.32;
        }
      }
      @keyframes hv-fade-up {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* V2 — spotlight is now system-wide via landing-shell; no per-section overlay. */
      .hv--v2 ::ng-deep .landing-bg--blueprint::before {
        opacity: 0.18;
      }

      /* ─── α — Settled stagger ────────────────────────────────────── */
      .hv--alpha-title {
        margin: 0;
        font-family: var(--landing-font-body);
        font-weight: 600;
        font-size: 96px;
        line-height: 104px;
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-text-300);
      }
      /* α stagger handled by fxStaggerChars directive (motion/stagger-chars). */
      .hv--alpha-dash {
        margin: 4px 0 0 0;
        padding-bottom: 12px;
        font-family: var(--landing-font-display);
        font-style: italic;
        color: var(--landing-accent);
        font-size: 64px;
        line-height: 72px;
        letter-spacing: var(--landing-tracking-tight);
        clip-path: inset(0 100% 0 0);
        animation: hv-alpha-reveal 700ms cubic-bezier(0.5, 0, 0, 1) 540ms both;
      }
      @keyframes hv-alpha-reveal {
        from {
          clip-path: inset(0 100% 0 0);
        }
        to {
          clip-path: inset(0 0 0 0);
        }
      }
      .hv--alpha-lead {
        opacity: 0;
        animation: hv-fade-up 600ms cubic-bezier(0.2, 0, 0.1, 1) 900ms both;
      }
      .hv--alpha-emphasis {
        opacity: 0;
        animation: hv-fade-up 600ms cubic-bezier(0.2, 0, 0.1, 1) 1020ms both;
      }

      /* ─── β — Marquee in ─────────────────────────────────────────── */
      .hv--beta-title {
        margin: 0;
        font-family: var(--landing-font-body);
        font-weight: 600;
        font-size: 96px;
        line-height: 104px;
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-text-300);
        display: block;
      }
      .hv--beta-name {
        display: block;
        opacity: 0;
        transform: translateX(-240px);
        animation: hv-beta-slide-in 900ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
      }
      @keyframes hv-beta-slide-in {
        from {
          opacity: 0;
          transform: translateX(-240px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .hv--beta-dash-row {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-top: 12px;
        overflow: visible;
      }
      .hv--beta-rule {
        display: block;
        height: 1px;
        background: var(--landing-accent);
        width: 0;
        animation: hv-beta-rule 480ms cubic-bezier(0.4, 0, 0.2, 1) 800ms both;
      }
      @keyframes hv-beta-rule {
        from {
          width: 0;
        }
        to {
          width: 96px;
        }
      }
      .hv--beta-role {
        padding-bottom: 12px;
        font-family: var(--landing-font-display);
        font-style: italic;
        font-weight: 400;
        font-size: 64px;
        line-height: 72px;
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-accent);
        opacity: 0;
        transform: translateX(120px);
        animation: hv-beta-role-in 800ms cubic-bezier(0.16, 1, 0.3, 1) 900ms both;
      }
      @keyframes hv-beta-role-in {
        from {
          opacity: 0;
          transform: translateX(120px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .hv--beta-lead {
        opacity: 0;
        animation: hv-fade-up 600ms cubic-bezier(0.2, 0, 0.1, 1) 1380ms both;
      }
      .hv--beta-emphasis {
        opacity: 0;
        animation: hv-fade-up 600ms cubic-bezier(0.2, 0, 0.1, 1) 1500ms both;
      }

      /* ─── γ — Diagonal mask wipe ─────────────────────────────────── */
      .hv--gamma-title {
        margin: 0;
        font-family: var(--landing-font-body);
        font-weight: 600;
        font-size: 96px;
        line-height: 104px;
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-text-300);
        display: block;
      }
      .hv--gamma-name {
        display: block;
        mask-image: linear-gradient(110deg, transparent 0%, transparent 28%, black 52%, black 100%);
        -webkit-mask-image: linear-gradient(110deg, transparent 0%, transparent 28%, black 52%, black 100%);
        mask-size: 250% 100%;
        -webkit-mask-size: 250% 100%;
        mask-repeat: no-repeat;
        -webkit-mask-repeat: no-repeat;
        mask-position: -20% 0%;
        -webkit-mask-position: -20% 0%;
        animation: hv-gamma-wipe 1100ms cubic-bezier(0.5, 0, 0, 1) 100ms both;
      }
      @keyframes hv-gamma-wipe {
        from {
          mask-position: -20% 0%;
          -webkit-mask-position: -20% 0%;
        }
        to {
          mask-position: 90% 0%;
          -webkit-mask-position: 90% 0%;
        }
      }
      .hv--gamma-dash-row {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-top: 12px;
        overflow: visible;
      }
      .hv--gamma-rule {
        display: block;
        height: 1px;
        background: var(--landing-accent);
        width: 0;
        animation: hv-gamma-rule 480ms cubic-bezier(0.4, 0, 0.2, 1) 1100ms both;
      }
      @keyframes hv-gamma-rule {
        from {
          width: 0;
        }
        to {
          width: 96px;
        }
      }
      .hv--gamma-role {
        padding-bottom: 12px;
        font-family: var(--landing-font-display);
        font-style: italic;
        font-weight: 400;
        font-size: 64px;
        line-height: 72px;
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-accent);
        opacity: 0;
        animation: hv-fade-up 700ms cubic-bezier(0.2, 0, 0.1, 1) 1500ms both;
      }
      .hv--gamma-lead {
        opacity: 0;
        animation: hv-fade-up 700ms cubic-bezier(0.2, 0, 0.1, 1) 1800ms both;
      }
      .hv--gamma-emphasis {
        opacity: 0;
        animation: hv-fade-up 700ms cubic-bezier(0.2, 0, 0.1, 1) 1940ms both;
      }

      /* ─── Meta subtle entrance (per-row stagger) ─────────────────── */
      /* Applied to all variants except V2 (which has no entrance phase). */
      .hv--v1 {
        --meta-start: 1300ms;
      }
      .hv--alpha {
        --meta-start: 1500ms;
      }
      .hv--beta {
        --meta-start: 1900ms;
      }
      .hv--gamma {
        --meta-start: 2200ms;
      }

      .hv:not(.hv--v2) .hv__meta-row {
        opacity: 0;
        animation: hv-meta-row-in 500ms cubic-bezier(0.2, 0, 0.1, 1) var(--meta-start, 1500ms) both;
      }
      .hv:not(.hv--v2) .hv__meta-row:nth-child(2) {
        animation-delay: calc(var(--meta-start, 1500ms) + 80ms);
      }
      .hv:not(.hv--v2) .hv__meta-row:nth-child(3) {
        animation-delay: calc(var(--meta-start, 1500ms) + 160ms);
      }
      @keyframes hv-meta-row-in {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* ─── Reduced motion safety net ──────────────────────────────── */
      @media (prefers-reduced-motion: reduce) {
        .hv--v1 ::ng-deep .landing-bg--blueprint::before,
        .hv--v1 .hv--v1-title,
        .hv--v1 .hv__sub-lead,
        .hv--v1 .hv__sub-emphasis,
        .hv--alpha-dash,
        .hv--alpha-lead,
        .hv--alpha-emphasis,
        .hv--beta-name,
        .hv--beta-rule,
        .hv--beta-role,
        .hv--beta-lead,
        .hv--beta-emphasis,
        .hv--gamma-name,
        .hv--gamma-rule,
        .hv--gamma-role,
        .hv--gamma-lead,
        .hv--gamma-emphasis,
        .hv:not(.hv--v2) .hv__meta-row {
          animation: none;
        }
        .hv--alpha-dash {
          clip-path: none;
        }
        .hv--beta-name,
        .hv--gamma-name {
          opacity: 1;
          transform: none;
          mask-image: none;
          -webkit-mask-image: none;
        }
        .hv--beta-role,
        .hv--gamma-role,
        .hv--alpha-lead,
        .hv--alpha-emphasis,
        .hv--beta-lead,
        .hv--beta-emphasis,
        .hv--gamma-lead,
        .hv--gamma-emphasis,
        .hv:not(.hv--v2) .hv__meta-row {
          opacity: 1;
          transform: none;
        }
        .hv--beta-rule,
        .hv--gamma-rule {
          width: 96px;
        }
      }

      /* ─── Replay button ──────────────────────────────────────────── */
      .hv__replay {
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
      .hv__replay:hover,
      .hv__replay:focus-visible {
        color: var(--landing-accent);
        border-color: var(--landing-accent);
        outline: none;
      }

      /* ─── Notes ──────────────────────────────────────────────────── */
      .hv-notes {
        padding-block: 32px;
        max-width: 56rem;
        margin-inline: auto;
      }
      .hv-notes__label {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-md);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-accent);
        margin: 0 0 8px 0;
      }
      .hv-notes__text {
        margin: 0;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }

      .hv-summary {
        padding-block: 48px;
        max-width: 56rem;
        margin-inline: auto;
      }
      .hv-summary__list {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 12px;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-md);
        line-height: var(--landing-body-md-lh);
        color: var(--landing-text-400);
      }
      .hv-summary__list strong {
        color: var(--landing-text-300);
        font-weight: 600;
        margin-right: 8px;
      }
      .hv-summary__note {
        margin: 24px 0 0 0;
        padding-top: 24px;
        border-top: 1px solid var(--landing-border);
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        color: var(--landing-text-500);
      }

      /* ─── Tablet ─────────────────────────────────────────────────── */
      @media (max-width: 1024px) {
        .hv--v1-title,
        .hv--alpha-title,
        .hv--beta-title,
        .hv--gamma-title {
          font-size: 64px;
          line-height: 72px;
        }
        .hv__title-dash,
        .hv--alpha-dash,
        .hv--beta-role,
        .hv--gamma-role {
          font-size: 48px;
          line-height: 56px;
        }
      }

      /* ─── Mobile ─────────────────────────────────────────────────── */
      @media (max-width: 768px) {
        .hv {
          min-height: calc(100vh - 64px);
          padding-block: 64px;
        }
        .hv--v1-title,
        .hv--alpha-title,
        .hv--beta-title,
        .hv--gamma-title {
          font-size: 48px;
          line-height: 56px;
        }
        .hv__title-dash,
        .hv--alpha-dash,
        .hv--beta-role,
        .hv--gamma-role {
          font-size: 32px;
          line-height: 40px;
        }
        .hv__meta {
          align-items: flex-start;
          text-align: left;
        }
        .hv__meta-row {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class HeroVariantsPage {
  readonly demo = DEMO;
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Hero variants' }];

  protected replay(host: HTMLElement): void {
    const animations = (
      host as HTMLElement & { getAnimations?: (opts?: { subtree?: boolean }) => Animation[] }
    ).getAnimations?.({ subtree: true });
    if (!animations) return;
    for (const a of animations) {
      a.cancel();
      a.play();
    }
  }
}
