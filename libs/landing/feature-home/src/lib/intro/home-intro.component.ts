import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ContainerComponent, EyebrowComponent } from '@portfolio/landing/shared/ui';

type Run = { readonly text: string; readonly italic: boolean };
type Paragraph = readonly Run[];

const ITALIC_PATTERN = /\*([^*]+)\*/g;

/**
 * Parses Owner-authored bioLong markdown into render-ready paragraphs.
 * - Paragraphs split on blank lines.
 * - `*phrase*` → italic emphasis run (Newsreader serif at render time).
 *
 * Kept inside the component because the parse is rendering-only: the source
 * stays in `Profile.bioLong` (per E5 content guardrail — no hardcoded copy).
 */
function parseBioLong(source: string): readonly Paragraph[] {
  if (!source) return [];
  return source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map<Paragraph>((block) => {
      const runs: Run[] = [];
      let cursor = 0;
      const text = block.replace(/\s+/g, ' ');
      ITALIC_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ITALIC_PATTERN.exec(text))) {
        if (match.index > cursor) {
          runs.push({ text: text.slice(cursor, match.index), italic: false });
        }
        runs.push({ text: match[1], italic: true });
        cursor = match.index + match[0].length;
      }
      if (cursor < text.length) {
        runs.push({ text: text.slice(cursor), italic: false });
      }
      return runs;
    });
}

@Component({
  selector: 'landing-home-intro',
  standalone: true,
  imports: [ContainerComponent, EyebrowComponent],
  templateUrl: './home-intro.component.html',
  styleUrl: './home-intro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeIntroComponent {
  readonly bioLong = input<string>('');

  protected readonly paragraphs = computed(() => parseBioLong(this.bioLong()));

  // ─── Lamp interaction ────────────────────────────────────────────────
  // -1 = lamp off, prose reads normally. Click paragraph → toggle; click
  // lamp body → toggle on at P1 / off; click anywhere else in section → off.
  protected readonly active = signal<number>(-1);
  protected readonly isLampOn = computed(() => this.active() !== -1);

  // Cone path in the asset's viewBox points roughly west-and-slightly-south
  // at ~176.5° from east when rotation = 0. Light pool center (in viewBox)
  // sits at (120.64, 191.25); rotation pivots on the joint (263.105, 48.85).
  private readonly DEFAULT_CONE_ANGLE_DEG = 176.5;
  protected readonly LAMP_PIVOT_X = 263.105;
  protected readonly LAMP_PIVOT_Y = 48.85;

  // Per-paragraph rotation, recomputed from DOM rects at runtime so the cone
  // always lands on the paragraph center regardless of how many paragraphs
  // bioLong yields or how the viewport reflows them.
  protected readonly lampAngles = signal<readonly number[]>([]);
  protected readonly lampRotate = computed(() => {
    const idx = this.active();
    const angles = this.lampAngles();
    const angle = idx === -1 ? 0 : (angles[idx] ?? 0);
    return `rotate(${angle.toFixed(2)} ${this.LAMP_PIVOT_X} ${this.LAMP_PIVOT_Y})`;
  });

  private readonly lampSvgRef = viewChild<ElementRef<SVGSVGElement>>('lampSvg');
  private readonly paraRefs = viewChildren<ElementRef<HTMLElement>>('storyPara');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    let ro: ResizeObserver | null = null;
    let rafId = 0;
    let resizeBound = false;

    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => this.recomputeAngles());
    };

    // Lazy setup + re-observation whenever the paragraph collection changes
    // (bioLong content swap, paragraph count drift). rAF coalesces resize bursts.
    // First measurement waits for `afterNextRender` so Angular has committed
    // the new DOM before we read getBoundingClientRect.
    effect(() => {
      const paragraphs = this.paraRefs();
      const svg = this.lampSvgRef();
      if (paragraphs.length === 0 || !svg) return;

      if (!ro) ro = new ResizeObserver(schedule);
      if (!resizeBound) {
        window.addEventListener('resize', schedule, { passive: true });
        resizeBound = true;
      }

      ro.disconnect();
      for (const p of paragraphs) ro.observe(p.nativeElement);
      ro.observe(svg.nativeElement);
      afterNextRender(() => this.recomputeAngles(), { injector: this.injector });
    });

    this.destroyRef.onDestroy(() => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      if (resizeBound) window.removeEventListener('resize', schedule);
    });
  }

  private recomputeAngles(): void {
    const svg = this.lampSvgRef();
    const paragraphs = this.paraRefs();
    if (!svg || paragraphs.length === 0) return;

    const svgRect = svg.nativeElement.getBoundingClientRect();
    if (svgRect.width === 0) return; // hidden (mobile)

    // viewBox is 474×474 with preserveAspectRatio="xMidYMid meet" → uniform scale.
    const scale = svgRect.width / 474;
    const lightX = svgRect.left + 120.64 * scale;
    const lightY = svgRect.top + 191.25 * scale;

    const angles = paragraphs.map((p) => {
      const r = p.nativeElement.getBoundingClientRect();
      const tx = r.left + r.width / 2;
      const ty = r.top + r.height / 2;
      const targetDeg = (Math.atan2(ty - lightY, tx - lightX) * 180) / Math.PI;
      const raw = targetDeg - this.DEFAULT_CONE_ANGLE_DEG;
      // Normalize to (-180, 180] so transitions never take the long way around.
      return ((raw + 540) % 360) - 180;
    });

    this.lampAngles.set(angles);
  }

  protected onParagraphClick(index: number, event: Event): void {
    event.stopPropagation();
    this.active.set(this.active() === index ? -1 : index);
  }

  protected onLampClick(event: Event): void {
    event.stopPropagation();
    this.active.set(this.isLampOn() ? -1 : 0);
  }

  protected onSectionClick(): void {
    this.active.set(-1);
  }
}
