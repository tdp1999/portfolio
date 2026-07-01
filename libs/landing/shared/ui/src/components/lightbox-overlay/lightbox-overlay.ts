import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { buildCloudinarySrcset } from '@portfolio/landing/shared/util';
import { LightboxService } from '../lightbox/lightbox.service';
import type { LightboxItem } from '../lightbox/lightbox.types';
import { CLOSE_MS, DOUBLE_TAP_SCALE, FULL_WIDTH, MAX_SCALE, MIN_SCALE } from './lightbox-overlay.data';
import type { ResolvedSource } from './lightbox-overlay.types';
import { clamp } from './lightbox-overlay.util';

/**
 * Full-screen lightbox UI. Mounted by {@link LightboxService} in a CDK Overlay.
 *
 * Owns the gesture engine: JS computes `scale`/`tx`/`ty` (zoom-to-point, pinch,
 * ctrl-wheel, double-tap, pan-with-clamp) and the pager `dragPx`, then writes
 * `transform` in a single `requestAnimationFrame`. CSS only renders. A FLIP pass
 * animates open/close from the trigger thumbnail. See
 * `.context/design/components/lightbox.md`.
 */
@Component({
  selector: 'landing-lightbox-overlay',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './lightbox-overlay.html',
  styleUrl: './lightbox-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'landing-lightbox' },
})
export class LightboxOverlay {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly lightbox = inject(LightboxService);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ── Queries ───────────────────────────────────────────────────────
  private readonly stageRef = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly trackRef = viewChild.required<ElementRef<HTMLElement>>('track');

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly items = this.lightbox.items;
  protected readonly index = this.lightbox.index;
  protected readonly count = computed(() => this.items().length);
  protected readonly current = computed(() => this.items()[this.index()] ?? null);
  protected readonly dialogLabel = computed(() => {
    const cur = this.current();
    return `Image ${this.index() + 1} of ${this.count()}${cur?.alt ? ` — ${cur.alt}` : ''}`;
  });
  protected readonly liveLabel = computed(() => `Image ${this.index() + 1} of ${this.count()}`);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly zoomed = signal(false);
  /** Current scale, mirrored as a signal for the toolbar button disabled-state. */
  protected readonly scaleSig = signal(1);

  // ── Plain state (constants exposed to template) ───────────────────
  protected readonly minScale = MIN_SCALE;
  protected readonly maxScale = MAX_SCALE;

  // ── Transform state (plain fields, written via rAF — not signals) ──
  private idx = 0;
  private dragPx = 0;
  private scale = 1;
  private tx = 0;
  private ty = 0;
  private rafId = 0;

  // ── Gesture state ──
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private mode: 'none' | 'swipe' | 'pan' | 'pinch' = 'none';
  private startX = 0;
  private startY = 0;
  private downX = 0;
  private downY = 0;
  private moved = false;
  private startTime = 0;
  private startScale = 1;
  private startDist = 0;
  private lastTapTime = 0;
  private closing = false;
  /** Whether the active pointer gesture started on the image (vs the backdrop). */
  private downOnImage = false;

  private readonly reduceMotion = this.isBrowser && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    this.idx = this.lightbox.index();
    afterNextRender(() => {
      this.attachListeners();
      // Jump straight to the opened slide with NO transition, so opening item 3
      // doesn't visibly sweep past 1 and 2. The pager transition is re-enabled
      // (class removed) before any user navigation.
      const track = this.trackRef().nativeElement;
      track.classList.add('is-grabbing');
      this.write();
      void track.offsetWidth; // commit the jump before the transition is live again
      track.classList.remove('is-grabbing');
      this.flipOpen();
    });
  }

  /** Resolve the best display source: explicit full > Cloudinary upscale > inline. */
  protected resolveBest(item: LightboxItem): ResolvedSource {
    if (item.fullSrc) {
      return { src: item.fullSrc, srcset: item.srcset ?? null, download: item.downloadUrl || item.fullSrc };
    }
    if (item.srcset) {
      return { src: item.url, srcset: item.srcset, download: item.downloadUrl || item.url };
    }
    const cl = buildCloudinarySrcset(item.url, FULL_WIDTH);
    if (cl.srcset) {
      return { src: cl.src, srcset: cl.srcset, download: item.downloadUrl || cl.src };
    }
    return { src: item.url, srcset: null, download: item.downloadUrl || item.url };
  }

  // ── Navigation ──
  protected go(dir: -1 | 1): void {
    this.setIndex(clamp(this.idx + dir, 0, this.count() - 1));
  }

  protected goTo(i: number): void {
    this.setIndex(clamp(i, 0, this.count() - 1));
  }

  private setIndex(i: number): void {
    if (i === this.idx) {
      this.resetZoom();
      this.dragPx = 0;
      this.enableNavTransition();
      this.schedule();
      return;
    }
    this.idx = i;
    this.dragPx = 0;
    this.resetZoom();
    this.enableNavTransition();
    this.zone.run(() => this.lightbox.index.set(i));
    this.schedule();
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.requestClose();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.go(1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.go(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.goTo(0);
        break;
      case 'End':
        event.preventDefault();
        this.goTo(this.count() - 1);
        break;
      case '0':
        event.preventDefault();
        this.resetZoom();
        this.schedule();
        break;
    }
  }

  // ── Close ──
  // The whole dialog fades out together (`is-closing` → opacity 0) so the chrome
  // never lingers without its backdrop; the image FLIPs toward the trigger in the
  // same window. A single timer disposes when the fade is done — no transitionend
  // race, no stray controls left on screen.
  protected requestClose(): void {
    if (this.closing) return;
    this.closing = true;
    this.resetZoom();
    const host = this.host();
    host.classList.add('is-closing');

    const img = this.activeImg();
    const rect = this.lightbox.currentTriggerRect();
    if (!this.reduceMotion && img && rect) {
      const from = img.getBoundingClientRect();
      // Skip the FLIP transform when the trigger rect is empty (e.g. a hidden
      // gallery "extra" entry, whose rect is 0×0) — fall back to the plain fade
      // instead of collapsing the image to scale(0) at the top-left corner.
      if (from.width && from.height && rect.width && rect.height) {
        const sx = rect.width / from.width;
        const dx = rect.left + rect.width / 2 - (from.left + from.width / 2);
        const dy = rect.top + rect.height / 2 - (from.top + from.height / 2);
        img.style.transition = 'transform var(--lightbox-flip) ease';
        img.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx})`;
      }
    }
    const dur = this.reduceMotion ? 0 : CLOSE_MS;
    setTimeout(() => this.zone.run(() => this.lightbox.close()), dur);
  }

  // ── Zoom ──
  /** Mirror the (mutable) scale into signals that drive the OnPush view. */
  private syncZoomState(): void {
    this.zone.run(() => {
      this.zoomed.set(this.scale > 1);
      this.scaleSig.set(this.scale);
    });
  }

  private resetZoom(): void {
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.syncZoomState();
  }

  /** Toolbar zoom-in / zoom-out — step at the stage centre. */
  protected zoomIn(): void {
    this.zoomAtCenter(this.scale * 1.6);
  }

  protected zoomOut(): void {
    this.zoomAtCenter(this.scale / 1.6);
  }

  private zoomAtCenter(next: number): void {
    const r = this.stageRef().nativeElement.getBoundingClientRect();
    this.enableZoomTransition();
    this.zoomTo(next, r.left + r.width / 2, r.top + r.height / 2);
    this.syncZoomState();
    this.schedule();
  }

  protected toggleZoomAt(clientX: number, clientY: number): void {
    if (this.scale > 1) {
      this.resetZoom();
    } else {
      this.zoomTo(DOUBLE_TAP_SCALE, clientX, clientY);
      this.syncZoomState();
    }
    this.enableZoomTransition();
    this.schedule();
  }

  /** Zoom to `next` scale keeping the point under (clientX, clientY) fixed. */
  private zoomTo(next: number, clientX: number, clientY: number): void {
    const stage = this.stageRef().nativeElement;
    const r = stage.getBoundingClientRect();
    const px = clientX - (r.left + r.width / 2);
    const py = clientY - (r.top + r.height / 2);
    const s2 = clamp(next, MIN_SCALE, MAX_SCALE);
    const ratio = s2 / this.scale;
    // Keep the image-space point under the cursor stationary (origin: center).
    this.tx = this.tx * ratio + px * (1 - ratio);
    this.ty = this.ty * ratio + py * (1 - ratio);
    this.scale = s2;
    this.clampPan();
  }

  private clampPan(): void {
    const stage = this.stageRef().nativeElement;
    const img = this.activeImg();
    if (!img) return;
    const maxX = Math.max(0, (img.clientWidth * this.scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.clientHeight * this.scale - stage.clientHeight) / 2);
    this.tx = clamp(this.tx, -maxX, maxX);
    this.ty = clamp(this.ty, -maxY, maxY);
  }

  // ── rAF writer ──
  private schedule(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.write();
    });
  }

  private write(): void {
    const track = this.trackRef().nativeElement;
    track.style.transform = `translate3d(calc(${-this.idx * 100}% + ${this.dragPx}px), 0, 0)`;
    const img = this.activeImg();
    if (img) {
      img.style.transform = `translate3d(${this.tx}px, ${this.ty}px, 0) scale(${this.scale})`;
    }
  }

  private activeImg(): HTMLImageElement | null {
    const slide = this.trackRef().nativeElement.children[this.idx] as HTMLElement | undefined;
    return (slide?.querySelector('img') as HTMLImageElement | null) ?? null;
  }

  private host(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  // ── FLIP open ──
  private flipOpen(): void {
    if (this.reduceMotion) return;
    const img = this.activeImg();
    const rect = this.lightbox.triggerRect();
    if (!img || !rect || !img.complete || !img.naturalWidth) return;
    const to = img.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const sx = rect.width / to.width;
    const dx = rect.left + rect.width / 2 - (to.left + to.width / 2);
    const dy = rect.top + rect.height / 2 - (to.top + to.height / 2);
    img.style.transition = 'none';
    img.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx})`;
    void img.offsetWidth; // force reflow so the next change transitions
    img.style.transition = 'transform var(--lightbox-flip) ease';
    img.style.transform = '';
    img.addEventListener(
      'transitionend',
      () => {
        img.style.transition = '';
      },
      { once: true }
    );
  }

  private enableNavTransition(): void {
    const track = this.trackRef().nativeElement;
    track.classList.remove('is-grabbing');
    const img = this.activeImg();
    if (img) img.style.transition = '';
  }

  private enableZoomTransition(): void {
    const img = this.activeImg();
    if (img) img.style.transition = 'transform var(--lightbox-zoom) ease';
  }

  // ── Pointer / wheel listeners (out of zone) ──
  private attachListeners(): void {
    const stage = this.stageRef().nativeElement;
    const track = this.trackRef().nativeElement;

    const onDown = (e: PointerEvent) => {
      // Only the primary mouse button drives gestures. A right/middle click opens
      // the native context menu (which swallows `pointerup`), so starting a
      // swipe/pan here would leave the gesture stuck and the image trailing the
      // cursor. Touch/pen have no non-primary button, so this is a no-op for them.
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      // Record this before capturing the pointer — setPointerCapture retargets the
      // subsequent `click` to the stage, so the click's own target is unreliable.
      this.downOnImage = !!(e.target as HTMLElement).closest?.('.landing-lightbox__img');
      stage.setPointerCapture?.(e.pointerId);
      if (this.pointers.size === 2) {
        this.beginPinch();
        return;
      }
      // Double-tap to zoom (touch + mouse).
      const now = e.timeStamp;
      if (now - this.lastTapTime < 300 && e.pointerType !== 'mouse') {
        this.toggleZoomAt(e.clientX, e.clientY);
        this.lastTapTime = 0;
        this.mode = 'none';
        return;
      }
      this.lastTapTime = now;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.downX = e.clientX;
      this.downY = e.clientY;
      this.moved = false;
      this.startTime = now;
      this.startScale = this.scale;
      this.mode = this.scale > 1 ? 'pan' : 'swipe';
      track.classList.add('is-grabbing');
      const img = this.activeImg();
      if (img) img.style.transition = '';
    };

    const onMove = (e: PointerEvent) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!this.moved && Math.hypot(e.clientX - this.downX, e.clientY - this.downY) > 6) {
        this.moved = true;
      }

      if (this.mode === 'pinch') {
        this.movePinch();
        this.schedule();
        return;
      }
      if (this.mode === 'pan') {
        this.tx += e.clientX - this.startX;
        this.ty += e.clientY - this.startY;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.clampPan();
        this.schedule();
        return;
      }
      if (this.mode === 'swipe') {
        const stageW = stage.clientWidth || 1;
        const dx = e.clientX - this.startX;
        this.dragPx = clamp(dx, -stageW, stageW);
        this.schedule();
      }
    };

    const onUp = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (stage.hasPointerCapture?.(e.pointerId)) stage.releasePointerCapture(e.pointerId);

      if (this.mode === 'pinch') {
        if (this.pointers.size < 2) {
          this.mode = this.scale > 1 ? 'pan' : 'none';
          if (this.scale <= 1) this.resetZoom();
          this.schedule();
        }
        return;
      }
      if (this.mode === 'pan') {
        this.mode = 'none';
        return;
      }
      if (this.mode === 'swipe') {
        this.mode = 'none';
        track.classList.remove('is-grabbing');
        const dx = e.clientX - this.startX;
        const dt = Math.max(1, e.timeStamp - this.startTime);
        const velocity = dx / dt;
        const stageW = stage.clientWidth || 1;
        // Sensitive to light drags: small distance OR a quick flick advances one.
        const distanceTrigger = Math.min(120, Math.max(40, stageW * 0.18));
        const velocityTrigger = 0.4;
        let dir: -1 | 0 | 1 = 0;
        if (dx <= -distanceTrigger || velocity <= -velocityTrigger) dir = 1;
        else if (dx >= distanceTrigger || velocity >= velocityTrigger) dir = -1;
        this.dragPx = 0;
        this.enableNavTransition();
        if (dir !== 0) this.go(dir);
        else this.schedule();
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return; // trackpad pinch maps to ctrl+wheel
      e.preventDefault();
      const next = this.scale * Math.exp(-e.deltaY * 0.01);
      this.zoomTo(next, e.clientX, e.clientY);
      this.syncZoomState();
      this.schedule();
    };

    const onDblClick = (e: MouseEvent) => {
      e.preventDefault();
      this.toggleZoomAt(e.clientX, e.clientY);
    };

    const onDragStart = (e: DragEvent) => e.preventDefault();

    // Click on the backdrop (anywhere but the image) closes — but never at the
    // end of a drag/pan/swipe (a moved gesture is not a "click outside").
    const onClick = () => {
      if (this.moved || this.downOnImage) return;
      this.zone.run(() => this.requestClose());
    };

    // Document keydown: cursor hint while Ctrl/⌘ held + Ctrl/⌘ ± to zoom (these
    // listeners only exist while the overlay is mounted, so they're scoped to it).
    const onDocKeydown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      stage.classList.toggle('is-zoom-modifier', mod);
      if (!mod) return;
      if (e.key === '+' || e.key === '=' || e.key === 'Add') {
        e.preventDefault();
        this.zoomIn();
      } else if (e.key === '-' || e.key === '_' || e.key === 'Subtract') {
        e.preventDefault();
        this.zoomOut();
      }
    };
    const onDocKeyup = (e: KeyboardEvent) => {
      stage.classList.toggle('is-zoom-modifier', e.ctrlKey || e.metaKey);
    };
    const clearKeyMod = () => stage.classList.remove('is-zoom-modifier');
    const doc = stage.ownerDocument;

    this.zone.runOutsideAngular(() => {
      stage.addEventListener('pointerdown', onDown);
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerup', onUp);
      stage.addEventListener('pointercancel', onUp);
      stage.addEventListener('wheel', onWheel, { passive: false });
      stage.addEventListener('dblclick', onDblClick);
      stage.addEventListener('dragstart', onDragStart);
      stage.addEventListener('click', onClick);
      doc.addEventListener('keydown', onDocKeydown);
      doc.addEventListener('keyup', onDocKeyup);
      window.addEventListener('blur', clearKeyMod);
    });

    this.destroyRef.onDestroy(() => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('dblclick', onDblClick);
      stage.removeEventListener('dragstart', onDragStart);
      stage.removeEventListener('click', onClick);
      doc.removeEventListener('keydown', onDocKeydown);
      doc.removeEventListener('keyup', onDocKeyup);
      window.removeEventListener('blur', clearKeyMod);
    });
  }

  private beginPinch(): void {
    const pts = [...this.pointers.values()];
    this.mode = 'pinch';
    this.startScale = this.scale;
    this.startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
    const img = this.activeImg();
    if (img) img.style.transition = '';
  }

  private movePinch(): void {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return;
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
    const midX = (pts[0].x + pts[1].x) / 2;
    const midY = (pts[0].y + pts[1].y) / 2;
    this.zoomTo(this.startScale * (dist / this.startDist), midX, midY);
    this.syncZoomState();
  }
}
