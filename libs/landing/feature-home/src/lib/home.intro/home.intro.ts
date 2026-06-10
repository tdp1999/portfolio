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
import { Container, Eyebrow, LandingThemeService } from '@portfolio/landing/shared/ui';
import type { PenAnchor } from './home.intro.types';
import { parseBioLong } from './home.intro.util';

@Component({
  selector: 'landing-home-intro',
  standalone: true,
  imports: [Container, Eyebrow],
  templateUrl: './home.intro.html',
  styleUrl: './home.intro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeIntro {
  readonly bioLong = input<string>('');

  protected readonly paragraphs = computed(() => parseBioLong(this.bioLong()));

  // ─── Light-source interaction ────────────────────────────────────────
  // -1 = off (lamp dark / pen at rest in inkwell), prose reads normally. Click
  // paragraph → toggle; click light source → toggle on at P1 / off; click
  // anywhere else in section → off.
  protected readonly active = signal<number>(-1);
  protected readonly isLampOn = computed(() => this.active() !== -1);

  // Theme drives which visual ("lamp" cone vs flying pen) and the hint copy.
  private readonly themeService = inject(LandingThemeService);
  protected readonly isLightTheme = computed(() => this.themeService.theme() === 'light');
  protected readonly hintText = computed(() => {
    if (this.isLightTheme()) {
      return this.isLampOn() ? 'click to rest' : 'click to mark';
    }
    return this.isLampOn() ? 'click to dim' : 'click to turn on';
  });

  // ─── Lamp rotation ───────────────────────────────────────────────────
  // 474×474 viewBox. Joint pivot at upper-right; light pool (apex of cone)
  // at (120.64, 191.25). The cone wedge is drawn at ~183° in the SVG; at rest
  // we rotate it so it aims at paragraph 1 (idx 0) — the lamp "wakes up
  // already pointing at the prose" rather than sitting at an arbitrary
  // default. Falls back to the SVG-native 183° until angles are measured.
  protected readonly LAMP_PIVOT_X = 263.105;
  protected readonly LAMP_PIVOT_Y = 48.85;
  // Native cone axis = joint→bulb axis (135° SW) — collinear so the light
  // always pours along the shade's pointing direction (no kink between head
  // and cone). Rotation = (target angle from bulb to focus point) − 135°.
  private readonly DEFAULT_CONE_ANGLE_DEG = 135;

  // Rest angle — fixed "drooped / asleep" pose. The head rotates from native
  // 135° (SW) to ~100° (nearly straight down + a touch east), as if gravity
  // is pulling the head limp over the desk. Clicking a paragraph wakes the
  // head up and tilts it toward that target. Tune REST_ANGLE_DEG between
  // 90° (straight down) and 130° (only slightly drooped) for taste.
  private readonly REST_ANGLE_DEG = 145;
  private readonly lampAngles = signal<readonly number[]>([]);

  protected readonly lampRotate = computed(() => {
    const idx = this.active();
    const target = idx === -1 ? this.REST_ANGLE_DEG : (this.lampAngles()[idx] ?? this.REST_ANGLE_DEG);
    const raw = target - this.DEFAULT_CONE_ANGLE_DEG;
    const normalized = ((raw + 540) % 360) - 180;
    return `rotate(${normalized.toFixed(2)} ${this.LAMP_PIVOT_X} ${this.LAMP_PIVOT_Y})`;
  });

  // ─── Floating pen position (light theme) ─────────────────────────────
  // Nib offset within the pen SVG's pixel box. The pen SVG is 100×110 px
  // with viewBox 0 0 200 220 (uniform scale 0.5). After the static tilt
  // (translate(15 200) rotate(-60) applied inside the SVG), the nib tip
  // sits at viewBox (~7.5, ~214) → element pixels (~3.75, ~107).
  private readonly PEN_NIB_OFFSET_X = 3.75;
  private readonly PEN_NIB_OFFSET_Y = 107;

  private readonly penDockAnchor = signal<PenAnchor>({ x: 0, y: 0 });
  private readonly penActiveAnchors = signal<readonly PenAnchor[]>([]);
  protected readonly penPositioned = signal(false);

  protected readonly penTransform = computed(() => {
    const idx = this.active();
    const anchor = idx === -1 ? this.penDockAnchor() : (this.penActiveAnchors()[idx] ?? this.penDockAnchor());
    const x = anchor.x - this.PEN_NIB_OFFSET_X;
    const y = anchor.y - this.PEN_NIB_OFFSET_Y;
    return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  });

  private readonly sectionRef = viewChild<ElementRef<HTMLElement>>('section');
  private readonly lampSvgRef = viewChild<ElementRef<SVGSVGElement>>('lampSvg');
  private readonly inkwellMouthRef = viewChild<ElementRef<SVGElement>>('inkwellMouth');
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
      rafId = requestAnimationFrame(() => this.recomputeLayout());
    };

    // Re-measure when the paragraph collection changes (bioLong swap), when
    // the SVG resizes, when the viewport reflows, or when the theme switches
    // (light theme reveals the inkwell — anchors must be re-read once it's
    // actually laid out). rAF coalesces resize bursts.
    effect(() => {
      this.themeService.theme();
      const paragraphs = this.paraRefs();
      const svg = this.lampSvgRef();
      const section = this.sectionRef();
      if (paragraphs.length === 0 || !svg || !section) return;

      if (!ro) ro = new ResizeObserver(schedule);
      if (!resizeBound) {
        window.addEventListener('resize', schedule, { passive: true });
        resizeBound = true;
      }

      ro.disconnect();
      for (const p of paragraphs) ro.observe(p.nativeElement);
      ro.observe(svg.nativeElement);
      ro.observe(section.nativeElement);
      afterNextRender(() => this.recomputeLayout(), { injector: this.injector });
    });

    this.destroyRef.onDestroy(() => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      if (resizeBound) window.removeEventListener('resize', schedule);
    });
  }

  private recomputeLayout(): void {
    const svg = this.lampSvgRef();
    const section = this.sectionRef();
    const paragraphs = this.paraRefs();
    if (!svg || !section || paragraphs.length === 0) return;

    const svgRect = svg.nativeElement.getBoundingClientRect();
    if (svgRect.width === 0) return; // hidden (mobile)

    const sectionRect = section.nativeElement.getBoundingClientRect();

    // Lamp cone target angles — atan2 from the light pool to each paragraph
    // center. viewBox 474×474 with preserveAspectRatio xMidYMid meet → uniform
    // scale; light pool at viewBox (120.64, 191.25).
    const scale = svgRect.width / 474;
    const lightX = svgRect.left + 120.64 * scale;
    const lightY = svgRect.top + 191.25 * scale;

    const lampAngles = paragraphs.map((p) => {
      const r = p.nativeElement.getBoundingClientRect();
      const tx = r.left + r.width / 2;
      const ty = r.top + r.height / 2;
      return (Math.atan2(ty - lightY, tx - lightX) * 180) / Math.PI;
    });
    this.lampAngles.set(lampAngles);

    // Pen anchors — section-relative coords so a translate() lands the nib
    // exactly at the inkwell mouth (dock) or at the right end of each
    // paragraph's underline (active). Only mark "positioned" once we've read
    // a valid mouth rect — in dark theme the inkwell is display:none, so the
    // rect is zero and the pen must stay hidden.
    const mouth = this.inkwellMouthRef()?.nativeElement;
    const mouthRect = mouth?.getBoundingClientRect();
    if (mouthRect && mouthRect.width > 0) {
      this.penDockAnchor.set({
        x: mouthRect.left + mouthRect.width / 2 - sectionRect.left,
        y: mouthRect.top + mouthRect.height / 2 - sectionRect.top,
      });
      if (!this.penPositioned()) this.penPositioned.set(true);
    }

    const activeAnchors = paragraphs.map<PenAnchor>((p) => {
      const r = p.nativeElement.getBoundingClientRect();
      // Right edge of the paragraph's underline + a small offset so the nib
      // sits flush against the line's finishing point.
      return {
        x: r.right - sectionRect.left + 4,
        y: r.bottom - sectionRect.top + 8,
      };
    });
    this.penActiveAnchors.set(activeAnchors);
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
