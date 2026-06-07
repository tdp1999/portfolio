import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  type BreadcrumbItem,
  Container,
  Eyebrow,
  Breadcrumb,
  LandingThemeService,
  ThemeToggle,
} from '@portfolio/landing/shared/ui';

/**
 * /ddl/contrast — live color-contrast matrix for the LANDING token system.
 *
 * Reads the *resolved* CSS custom properties from the running document (so it can
 * never drift from tokens/colors.scss) and scores every text↔surface pair with the
 * SAME formulas the contrast-audit skill uses: WCAG 2.x ratio (the legal gate) and
 * APCA Lc (the perceptual quality bar that catches weak dark-mode text). Toggle the
 * theme to re-score both modes. The audit script is the CI gate; this page is the eye.
 */

type Role = 'body' | 'caption' | 'link' | 'onAccent' | 'focus';

const ROLE_FLOOR: Record<Role, { wcag: number; apca: number; label: string }> = {
  body: { wcag: 4.5, apca: 75, label: 'Body' },
  caption: { wcag: 4.5, apca: 60, label: 'Caption' },
  link: { wcag: 4.5, apca: 75, label: 'Link' },
  onAccent: { wcag: 4.5, apca: 75, label: 'On-accent' },
  focus: { wcag: 3.0, apca: 45, label: 'Focus / non-text' },
};

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Cell {
  surface: string;
  hex: string;
  wcag: number;
  apca: number;
  passWcag: boolean;
  passApca: boolean;
}

interface TextRow {
  token: string;
  label: string;
  role: Role;
  hex: string;
  cells: Cell[];
}

interface RampStep {
  token: string;
  label: string;
  hex: string;
  apca: number;
}

interface SurfaceLayer {
  token: string;
  label: string;
  hex: string;
  /** WCAG ratio vs the previous (lower) layer — must read as a distinct step. */
  vsPrev: number | null;
}

interface OnAccentRow {
  label: string;
  fillToken: string;
  fillHex: string;
  wcag: number;
  apca: number;
  passWcag: boolean;
  passApca: boolean;
}

const SURFACES: ReadonlyArray<{ token: string; label: string }> = [
  { token: '--landing-bg', label: 'bg' },
  { token: '--landing-surface', label: 'surface' },
  { token: '--landing-surface-elevated', label: 'elevated' },
];

const TEXT_TOKENS: ReadonlyArray<{ token: string; label: string; role: Role }> = [
  { token: '--landing-text-300', label: 'text-300 · primary', role: 'body' },
  { token: '--landing-text-400', label: 'text-400 · secondary', role: 'body' },
  { token: '--landing-text-500', label: 'text-500 · muted', role: 'body' },
  { token: '--landing-text-600', label: 'text-600 · caption', role: 'caption' },
  { token: '--landing-accent', label: 'accent · link / icon', role: 'link' },
];

@Component({
  selector: 'landing-ddl-contrast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, Container, Breadcrumb, Eyebrow, ThemeToggle],
  template: `
    <div class="border-b border-landing-border bg-ink-1/60">
      <landing-container size="wide">
        <div class="flex flex-wrap items-end justify-between gap-4 py-6">
          <div>
            <landing-breadcrumb [items]="breadcrumb" class="mb-3 block" />
            <h1 class="font-display text-display-md text-landing-text-300">Contrast &amp; color</h1>
            <p class="font-sans text-body-md text-landing-text-400 mt-2 max-w-2xl">
              Live WCAG 2.x + APCA scores for the landing token system, resolved from the running document. Toggle the
              theme to re-score both modes. The
              <code class="font-mono text-mono-sm text-landing-accent">contrast-audit</code> skill is the CI gate; this
              page is the eye.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono text-mono-sm text-landing-text-600">theme</span>
            <landing-theme-toggle />
          </div>
        </div>
      </landing-container>
    </div>

    <landing-container size="wide">
      <div class="space-y-12 py-8">
        @if (!ready()) {
          <p class="font-mono text-mono-md text-landing-text-500">Resolving tokens…</p>
        }

        <!-- Legend -->
        <section class="rounded-lg border border-landing-border bg-ink-1/40 p-4">
          <p class="font-sans text-body-sm text-landing-text-400">
            <strong class="text-landing-text-300">WCAG</strong> ratio is the legal floor (4.5:1 text, 3:1
            large/non-text). <strong class="text-landing-text-300">APCA Lc</strong> (0–106) is the perceptual bar — body
            wants Lc 75, caption 60, non-text 45.
            <span class="text-landing-text-500"
              >WCAG over-rates dark mode, so a pair can pass WCAG yet read weak (low Lc) — that gap is the point of
              showing both.</span
            >
          </p>
          <div class="mt-3 flex flex-wrap gap-4 font-mono text-mono-sm">
            <span class="text-landing-text-500"><span class="text-emerald-500">●</span> pass</span>
            <span class="text-landing-text-500"><span class="text-amber-500">●</span> WCAG ok · APCA low</span>
            <span class="text-landing-text-500"><span class="text-red-500">●</span> WCAG fail</span>
          </div>
        </section>

        <!-- Text × surface matrix -->
        <section>
          <landing-eyebrow>Text on surfaces</landing-eyebrow>
          <h2 class="font-display text-display-sm text-landing-text-300 mb-1 mt-2">Text contrast matrix</h2>
          <p class="font-sans text-body-sm text-landing-text-500 mb-5 max-w-2xl">
            Each tier against every surface. The sample shows the real rendered pair; the badge shows its score and role
            floor.
          </p>

          <div class="space-y-3">
            @for (row of textRows(); track row.token) {
              <div class="grid grid-cols-1 gap-3 laptop:grid-cols-[180px_repeat(3,1fr)] laptop:items-stretch">
                <div class="flex flex-col justify-center">
                  <span class="font-mono text-mono-md text-landing-text-300">{{ row.label }}</span>
                  <span class="font-mono text-mono-sm text-landing-text-600">
                    {{ row.hex }} · {{ floorLabel(row.role) }}
                  </span>
                </div>
                @for (cell of row.cells; track cell.surface) {
                  <div
                    class="contrast-cell rounded-md border border-landing-border p-3"
                    [style.background]="'var(' + cell.surface + ')'"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-display text-display-sm leading-none" [style.color]="row.hex">Ag</span>
                      <span class="status-dot" [class]="statusClass(cell.passWcag, cell.passApca)"></span>
                    </div>
                    <div class="mt-2 font-mono text-mono-sm" [style.color]="row.hex">
                      {{ cell.wcag | number: '1.2-2' }}:1 · Lc {{ absLc(cell.apca) }}
                    </div>
                    <div class="font-mono text-mono-sm text-landing-text-600">{{ cell.surface }}</div>
                  </div>
                }
              </div>
            }
          </div>
        </section>

        <!-- On-accent fills (the fill-vs-text split) -->
        <section>
          <landing-eyebrow>Accent fills</landing-eyebrow>
          <h2 class="font-display text-display-sm text-landing-text-300 mb-1 mt-2">White label on accent</h2>
          <p class="font-sans text-body-sm text-landing-text-500 mb-5 max-w-2xl">
            Solid buttons render white text on
            <code class="font-mono text-mono-sm text-landing-accent">--landing-accent-strong</code>, kept dark enough to
            carry a label — while <code class="font-mono text-mono-sm text-landing-accent">--landing-accent</code> is
            free to lift for link/icon legibility. Two tokens, two jobs.
          </p>
          <div class="flex flex-wrap gap-4">
            @for (row of onAccentRows(); track row.label) {
              <div class="rounded-lg border border-landing-border p-4">
                <div
                  class="flex items-center justify-center rounded-md px-6 py-3"
                  [style.background]="'var(' + row.fillToken + ')'"
                >
                  <span class="font-sans text-body-md font-semibold" style="color: #ffffff">{{ row.label }}</span>
                </div>
                <div class="mt-2 flex items-center gap-2 font-mono text-mono-sm text-landing-text-500">
                  <span class="status-dot" [class]="statusClass(row.passWcag, row.passApca)"></span>
                  {{ row.wcag | number: '1.2-2' }}:1 · Lc {{ absLc(row.apca) }} · {{ row.fillHex }}
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Focus ring -->
        <section>
          <landing-eyebrow>Focus</landing-eyebrow>
          <h2 class="font-display text-display-sm text-landing-text-300 mb-1 mt-2">Focus ring vs surface</h2>
          <p class="font-sans text-body-sm text-landing-text-500 mb-5 max-w-2xl">
            The accent ring must clear 3:1 against whatever it sits on (WCAG 2.4.11 / 1.4.11).
          </p>
          <div class="flex flex-wrap gap-6">
            @for (cell of focusCells(); track cell.surface) {
              <div
                class="flex items-center gap-3 rounded-md border border-landing-border p-4"
                [style.background]="'var(' + cell.surface + ')'"
              >
                <span
                  class="inline-block h-10 w-10 rounded-md"
                  [style.background]="'var(' + cell.surface + ')'"
                  [style.outline]="'3px solid ' + cell.hex"
                  style="outline-offset: 2px"
                ></span>
                <span class="font-mono text-mono-sm" [style.color]="textOn(cell.surface)">
                  {{ cell.wcag | number: '1.2-2' }}:1 · Lc {{ absLc(cell.apca) }}
                  <span class="status-dot ml-1" [class]="statusClass(cell.passWcag, cell.passApca)"></span>
                </span>
              </div>
            }
          </div>
        </section>

        <!-- Hierarchy ramp -->
        <section>
          <landing-eyebrow>Hierarchy</landing-eyebrow>
          <h2 class="font-display text-display-sm text-landing-text-300 mb-1 mt-2">Text tier ramp (on bg)</h2>
          <p class="font-sans text-body-sm text-landing-text-500 mb-5 max-w-2xl">
            Tiers must stay distinct and monotonic. Lc should step down smoothly from primary to caption.
          </p>
          <div class="space-y-2 rounded-lg border border-landing-border bg-ink-0 p-5">
            @for (step of ramp(); track step.token) {
              <div class="flex items-baseline justify-between gap-4">
                <span class="font-sans text-body-lg" [style.color]="step.hex">{{ step.label }}</span>
                <span class="font-mono text-mono-sm text-landing-text-600"
                  >Lc {{ absLc(step.apca) }} · {{ step.hex }}</span
                >
              </div>
            }
          </div>
        </section>

        <!-- Surface layers -->
        <section>
          <landing-eyebrow>Layers</landing-eyebrow>
          <h2 class="font-display text-display-sm text-landing-text-300 mb-1 mt-2">Surface distinctness</h2>
          <p class="font-sans text-body-sm text-landing-text-500 mb-5 max-w-2xl">
            Adjacent surfaces need a small but real luminance step (≥1.05:1) or layers visually merge.
          </p>
          <div class="space-y-3">
            @for (layer of layers(); track layer.token) {
              <div class="rounded-md border border-landing-border p-4" [style.background]="'var(' + layer.token + ')'">
                <span class="font-mono text-mono-sm text-landing-text-400">
                  {{ layer.token }} · {{ layer.hex }}
                  @if (layer.vsPrev !== null) {
                    <span class="text-landing-text-600">· vs prev {{ layer.vsPrev | number: '1.2-2' }}:1</span>
                  }
                </span>
              </div>
            }
          </div>
        </section>
      </div>
    </landing-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .status-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex: none;
      }
      .status-pass {
        background: #10b981;
      }
      .status-warn {
        background: #f59e0b;
      }
      .status-fail {
        background: #ef4444;
      }
    `,
  ],
})
export class DdlContrast {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly themeService = inject(LandingThemeService);

  readonly breadcrumb: BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Contrast' }];

  readonly ready = signal(false);
  readonly textRows = signal<TextRow[]>([]);
  readonly onAccentRows = signal<OnAccentRow[]>([]);
  readonly focusCells = signal<Cell[]>([]);
  readonly ramp = signal<RampStep[]>([]);
  readonly layers = signal<SurfaceLayer[]>([]);

  private probe: HTMLElement | null = null;

  constructor() {
    afterNextRender(() => this.compute());
    // Re-score whenever the theme flips. The service applies data-theme in its own
    // effect; rAF lets the cascade settle before we read getComputedStyle.
    effect(() => {
      this.themeService.theme();
      if (!isPlatformBrowser(this.platformId)) return;
      requestAnimationFrame(() => this.compute());
    });
  }

  floorLabel(role: Role): string {
    const f = ROLE_FLOOR[role];
    return `${f.label} ${f.wcag}:1 / Lc${f.apca}`;
  }

  absLc(apca: number): string {
    return Math.abs(apca).toFixed(0);
  }

  statusClass(passWcag: boolean, passApca: boolean): string {
    if (!passWcag) return 'status-fail';
    return passApca ? 'status-pass' : 'status-warn';
  }

  /** Best-contrast text color for labels rendered on a given surface token. */
  textOn(surfaceToken: string): string {
    const bg = this.resolve(surfaceToken);
    return bg && relLuminance(bg) > 0.4 ? '#0f172a' : '#e2e8f0';
  }

  // --- compute ---------------------------------------------------------------
  private compute(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const surfaces = SURFACES.map((s) => ({ ...s, rgb: this.resolve(s.token) })).filter(
      (s): s is { token: string; label: string; rgb: RGB } => !!s.rgb
    );

    // text × surface matrix
    const textRows: TextRow[] = [];
    for (const t of TEXT_TOKENS) {
      const fg = this.resolve(t.token);
      if (!fg) continue;
      const floor = ROLE_FLOOR[t.role];
      const cells: Cell[] = surfaces.map((s) => {
        const wcag = wcagRatio(fg, s.rgb);
        const apca = apcaLc(fg, s.rgb);
        return {
          surface: s.token,
          hex: toHex(s.rgb),
          wcag,
          apca,
          passWcag: wcag >= floor.wcag,
          passApca: Math.abs(apca) >= floor.apca,
        };
      });
      textRows.push({ token: t.token, label: t.label, role: t.role, hex: toHex(fg), cells });
    }
    this.textRows.set(textRows);

    // on-accent fills: white label on the strong fill
    const white: RGB = { r: 255, g: 255, b: 255 };
    const accentFloor = ROLE_FLOOR.onAccent;
    const onAccent: OnAccentRow[] = [];
    const strong = this.resolve('--landing-accent-strong');
    if (strong) {
      const wcag = wcagRatio(white, strong);
      const apca = apcaLc(white, strong);
      onAccent.push({
        label: 'Solid button',
        fillToken: '--landing-accent-strong',
        fillHex: toHex(strong),
        wcag,
        apca,
        passWcag: wcag >= accentFloor.wcag,
        passApca: Math.abs(apca) >= accentFloor.apca,
      });
    }
    this.onAccentRows.set(onAccent);

    // focus ring (accent) vs surfaces
    const accent = this.resolve('--landing-accent');
    const focusFloor = ROLE_FLOOR.focus;
    const focusCells: Cell[] = accent
      ? surfaces.map((s) => {
          const wcag = wcagRatio(accent, s.rgb);
          const apca = apcaLc(accent, s.rgb);
          return {
            surface: s.token,
            hex: toHex(accent),
            wcag,
            apca,
            passWcag: wcag >= focusFloor.wcag,
            passApca: Math.abs(apca) >= focusFloor.apca,
          };
        })
      : [];
    this.focusCells.set(focusCells);

    // hierarchy ramp (text tiers on bg)
    const bg = surfaces[0]?.rgb;
    const ramp: RampStep[] = [];
    if (bg) {
      for (const t of TEXT_TOKENS) {
        const fg = this.resolve(t.token);
        if (!fg) continue;
        ramp.push({ token: t.token, label: t.label, hex: toHex(fg), apca: apcaLc(fg, bg) });
      }
    }
    this.ramp.set(ramp);

    // surface layers (adjacent distinctness)
    const layers: SurfaceLayer[] = surfaces.map((s, i) => ({
      token: s.token,
      label: s.label,
      hex: toHex(s.rgb),
      vsPrev: i === 0 ? null : wcagRatio(s.rgb, surfaces[i - 1].rgb),
    }));
    this.layers.set(layers);

    this.ready.set(true);
  }

  /** Resolve a CSS custom property (following var() chains) to an RGB triple. */
  private resolve(token: string): RGB | null {
    if (!this.probe) {
      this.probe = this.document.createElement('span');
      this.probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
      this.document.documentElement.appendChild(this.probe);
    }
    this.probe.style.color = '';
    this.probe.style.color = `var(${token})`;
    const computed = this.document.defaultView?.getComputedStyle(this.probe).color ?? '';
    return parseRgb(computed);
  }
}

// --- color math (mirrors .claude/skills/contrast-audit engine) ----------------
function parseRgb(value: string): RGB | null {
  const m = value.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const nums = m[1].replace(/\//g, ' ').replace(/,/g, ' ').trim().split(/\s+/).map(Number);
  if (nums.length < 3 || nums.some((n) => Number.isNaN(n))) return null;
  return { r: nums[0], g: nums[1], b: nums[2] };
}

function toHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function relLuminance({ r, g, b }: RGB): number {
  const lin = (c: number): number => {
    const cs = c / 255;
    return cs <= 0.04045 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function wcagRatio(fg: RGB, bg: RGB): number {
  const l1 = relLuminance(fg);
  const l2 = relLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function sRGBtoY({ r, g, b }: RGB): number {
  const e = (c: number): number => (c / 255) ** 2.4;
  return 0.2126729 * e(r) + 0.7151522 * e(g) + 0.072175 * e(b);
}

/** APCA-W3 (frozen constants 2021-02-15). Returns signed Lc on a ±106 scale. */
function apcaLc(txt: RGB, bg: RGB): number {
  const blkThrs = 0.022;
  const blkClmp = 1.414;
  const clamp = (y: number): number => (y > blkThrs ? y : y + (blkThrs - y) ** blkClmp);
  const yTxt = clamp(sRGBtoY(txt));
  const yBg = clamp(sRGBtoY(bg));
  if (Math.abs(yBg - yTxt) < 0.0005) return 0;
  let sapc: number;
  let out: number;
  if (yBg > yTxt) {
    sapc = (yBg ** 0.56 - yTxt ** 0.57) * 1.14;
    out = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    sapc = (yBg ** 0.65 - yTxt ** 0.62) * 1.14;
    out = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return out * 100;
}
