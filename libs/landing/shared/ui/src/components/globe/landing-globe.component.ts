import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  computed,
  inject,
  input,
  OnDestroy,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import type { COBEOptions, Globe } from 'cobe';
import { LandingThemeService, type LandingTheme } from '../../theme';

/**
 * `cobe` is ~30 KB and only needed once we're past `afterNextRender`. Importing
 * at module top level would land it in the initial bundle even though it isn't
 * used until the home Get-in-Touch section is in the DOM. Dynamic-import keeps it
 * in a separate lazy chunk so initial JS gzipped stays under the 150 KB budget.
 */
type CreateGlobeFn = (canvas: HTMLCanvasElement, opts: COBEOptions) => Globe;
let createGlobePromise: Promise<CreateGlobeFn> | null = null;
function loadCreateGlobe(): Promise<CreateGlobeFn> {
  if (!createGlobePromise) {
    createGlobePromise = import('cobe').then((m) => m.default as unknown as CreateGlobeFn);
  }
  return createGlobePromise;
}

/** Fixed backing-buffer size — decouples cobe init from CSS layout timing.
 *  Browser scales the rendered canvas to fit its CSS width. */
const BUFFER_SIZE = 800;
/** Initial phi aims the camera at ~120°E so HCMC / Singapore / Sydney are
 *  facing the viewer on first paint. */
const BASE_PHI = 2.6;
const BASE_THETA = 0.2;

type GlobeCity = {
  readonly id: string;
  readonly label: string;
  readonly lat: number;
  readonly lng: number;
};

const MARKER_SIZE = 0.035;
const CITIES: readonly GlobeCity[] = [
  { id: 'hcmc', label: 'Ho Chi Minh City', lat: 10.78, lng: 106.7 },
  { id: 'sgp', label: 'Singapore', lat: 1.35, lng: 103.82 },
  { id: 'syd', label: 'Australia', lat: -33.87, lng: 151.21 },
];

/** Projected sphere radius, as a % of the container's smaller side.
 *  Cobe's default `scale: 1` renders the sphere at ~85% of the canvas; half = ~42%. */
const PROJECTED_RADIUS_PCT = 41;

type GlobePalette = Pick<
  COBEOptions,
  'dark' | 'baseColor' | 'markerColor' | 'glowColor' | 'mapBrightness' | 'mapBaseBrightness' | 'diffuse' | 'opacity'
>;

const PALETTES: Record<LandingTheme, GlobePalette> = {
  dark: {
    dark: 1,
    diffuse: 1.2,
    mapBrightness: 6,
    baseColor: [0.4, 0.45, 0.7],
    // landing-accent (dark) #6e66d9 → [0.43, 0.40, 0.85]
    markerColor: [0.43, 0.4, 0.85],
    glowColor: [0.4, 0.45, 0.7],
    opacity: 1,
  },
  light: {
    dark: 0,
    diffuse: 1.4,
    mapBrightness: 12,
    baseColor: [0.85, 0.88, 0.96],
    // landing-accent (light) #5b53c2 → [0.36, 0.33, 0.76]
    markerColor: [0.36, 0.33, 0.76],
    glowColor: [1, 1, 1],
    opacity: 0.85,
  },
};

@Component({
  selector: 'landing-globe',
  standalone: true,
  imports: [],
  templateUrl: './landing-globe.component.html',
  styleUrl: './landing-globe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingGlobeComponent implements OnDestroy {
  private readonly themeService = inject(LandingThemeService);
  private readonly zone = inject(NgZone);

  readonly interactive = input<boolean>(false);

  protected readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private globe: Globe | null = null;
  private phi = BASE_PHI;
  protected readonly phiSig = signal(BASE_PHI);
  protected readonly hasGlobe = signal(true);
  private rafId: number | null = null;
  private lastTheme: LandingTheme | null = null;
  private destroyed = false;

  /** Label positions are derived from current phi (signal-driven so the
   *  template repaints on drag; outside drag, phi is stable). */
  protected readonly labels = computed(() => {
    const phi = this.phiSig();
    return CITIES.map((city) => {
      const lat = (city.lat * Math.PI) / 180;
      const lng = (city.lng * Math.PI) / 180;
      const dLng = lng + phi + Math.PI / 2;
      const x = Math.cos(lat) * Math.sin(dLng);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.cos(dLng);
      // theta is a tilt around the X axis — apply to (y, z).
      const yTilted = y * Math.cos(BASE_THETA) - z * Math.sin(BASE_THETA);
      const zTilted = y * Math.sin(BASE_THETA) + z * Math.cos(BASE_THETA);
      return {
        id: city.id,
        label: city.label,
        left: 50 + x * PROJECTED_RADIUS_PCT,
        top: 50 - yTilted * PROJECTED_RADIUS_PCT,
        visible: zTilted > -0.05,
      };
    });
  });

  private isDragging = false;
  private dragStartX = 0;
  private dragStartPhi = 0;

  constructor() {
    afterNextRender(() => this.initGlobe());

    // cobe v2's update() accepts color/lighting params, so we re-theme live
    // without destroying the globe. Skip the effect's initial run so we don't
    // poke cobe before its dot-map sampler has primed.
    effect(() => {
      const theme = this.themeService.theme();
      const isFirstRun = this.lastTheme === null;
      this.lastTheme = theme;
      if (isFirstRun) return;
      this.globe?.update({ ...PALETTES[theme], phi: this.phi });
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.globe?.destroy();
  }

  private async initGlobe(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;

    let createGlobe: CreateGlobeFn;
    try {
      createGlobe = await loadCreateGlobe();
    } catch {
      this.hasGlobe.set(false);
      return;
    }

    // Component may have been destroyed while waiting for the cobe chunk to load
    // (fast back-nav). Bail before allocating WebGL state to avoid a leaked Globe
    // instance + rAF loop that ngOnDestroy already ran past.
    if (this.destroyed) return;

    try {
      this.globe = createGlobe(canvas, {
        devicePixelRatio: 1,
        width: BUFFER_SIZE,
        height: BUFFER_SIZE,
        phi: this.phi,
        theta: BASE_THETA,
        scale: 1.0,
        mapSamples: 16000,
        offset: [0, 0],
        markers: CITIES.map((c) => ({ location: [c.lat, c.lng], size: MARKER_SIZE })),
        ...PALETTES[this.themeService.theme()],
      });
    } catch {
      // WebGL2 unavailable (old GPU / disabled accel). Hide canvas + labels;
      // the section still reads cleanly without the visual anchor.
      this.hasGlobe.set(false);
      return;
    }

    // cobe v2 doesn't auto-tick — drive it from our own rAF loop so the dot map
    // always paints without drag. Run outside Angular zone to avoid triggering
    // change detection every frame.
    this.zone.runOutsideAngular(() => {
      const tick = (): void => {
        this.globe?.update({ phi: this.phi });
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.interactive()) return;
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartPhi = this.phi;
    (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    const delta = event.clientX - this.dragStartX;
    this.phi = this.dragStartPhi + delta * 0.005;
    this.phiSig.set(this.phi);
    this.globe?.update({ phi: this.phi });
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    (event.currentTarget as Element | null)?.releasePointerCapture?.(event.pointerId);
  }
}
