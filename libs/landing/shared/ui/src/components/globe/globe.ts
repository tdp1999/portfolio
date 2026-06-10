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
import type { Globe as CobeGlobe } from 'cobe';
import { LandingThemeService } from '../../theme';
import type { LandingTheme } from '../../theme';
import {
  AUTO_ROTATE_RESUME_MS,
  AUTO_ROTATE_STEP,
  BASE_PHI,
  BASE_THETA,
  BUFFER_SIZE,
  CITIES,
  MARKER_SIZE,
  PALETTES,
  PROJECTED_RADIUS_PCT,
} from './globe.constants';
import { loadCreateGlobe } from './globe.util';
import type { CreateGlobeFn } from './globe.util';

@Component({
  selector: 'landing-globe',
  standalone: true,
  imports: [],
  templateUrl: './globe.html',
  styleUrl: './globe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Globe implements OnDestroy {
  private readonly themeService = inject(LandingThemeService);
  private readonly zone = inject(NgZone);

  readonly interactive = input<boolean>(false);
  /** Spin the globe automatically when the user isn't dragging it. Idle-pauses
   *  for `AUTO_ROTATE_RESUME_MS` after a drag so the user can land where they
   *  meant to. */
  readonly autoRotate = input<boolean>(false);

  protected readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private globe: CobeGlobe | null = null;
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
  /** Timestamp until which auto-rotate is suppressed (post-drag idle hold). */
  private autoRotatePauseUntil = 0;

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
        if (this.autoRotate() && !this.isDragging && performance.now() >= this.autoRotatePauseUntil) {
          this.phi += AUTO_ROTATE_STEP;
          // Mirror into the signal so projected city labels track the rotation,
          // but skip when stationary so we don't churn change detection.
          this.phiSig.set(this.phi);
        }
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
    this.autoRotatePauseUntil = performance.now() + AUTO_ROTATE_RESUME_MS;
    (event.currentTarget as Element | null)?.releasePointerCapture?.(event.pointerId);
  }
}
