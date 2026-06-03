import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LightboxOverlayComponent } from './lightbox-overlay.component';
import type { LightboxEntry, LightboxItem } from './lightbox.types';

/**
 * Drives the landing lightbox. Triggers register themselves (one per opt-in
 * figure via `[lightbox]`); on open the service orders a group's entries by DOM
 * position, builds the item list, and mounts {@link LightboxOverlayComponent} in
 * a CDK Overlay with a blocking scroll strategy. Service-driven so the overlay
 * opens from ANY page without editing the shell.
 *
 * SSR-safe: `open()` only ever runs from a browser click, so the overlay (and its
 * `document`/pointer access) never executes during server render.
 */
@Injectable({ providedIn: 'root' })
export class LightboxService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  private readonly groups = new Map<string, Set<LightboxEntry>>();
  private overlayRef: OverlayRef | null = null;
  /** DOM-ordered entries for the currently open group (for FLIP-close rects). */
  private active: LightboxEntry[] = [];

  /** Image list for the open group. */
  readonly items = signal<readonly LightboxItem[]>([]);
  /** Active slide index. */
  readonly index = signal(0);
  /** Trigger rect captured at open time, for the FLIP-open animation. */
  readonly triggerRect = signal<DOMRect | null>(null);
  private readonly open$ = signal(false);
  readonly isOpen = computed(() => this.open$());

  /** Register a trigger. Returns an unregister fn (call on directive destroy). */
  register(entry: LightboxEntry): () => void {
    let set = this.groups.get(entry.group);
    if (!set) {
      set = new Set<LightboxEntry>();
      this.groups.set(entry.group, set);
    }
    set.add(entry);
    return () => {
      const s = this.groups.get(entry.group);
      if (!s) return;
      s.delete(entry);
      if (s.size === 0) this.groups.delete(entry.group);
    };
  }

  /** Open the lightbox for `group`, focused on the `from` trigger. */
  open(group: string, from: LightboxEntry): void {
    const set = this.groups.get(group);
    if (!set || set.size === 0) return;

    const ordered = [...set].sort((a, b) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );
    this.active = ordered;
    this.items.set(ordered.map((e) => e.item()));
    this.index.set(Math.max(0, ordered.indexOf(from)));
    this.triggerRect.set(from.getRect());
    this.mount();
  }

  /** Trigger rect for the slide currently shown (FLIP-close target). */
  currentTriggerRect(): DOMRect | null {
    return this.active[this.index()]?.getRect() ?? null;
  }

  /** Dispose the overlay. The overlay component runs its close animation first. */
  close(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.active = [];
    this.open$.set(false);
  }

  private mount(): void {
    if (this.overlayRef) return;
    const ref = this.overlay.create({
      hasBackdrop: false, // own scrim inside the panel for blur + FLIP control
      positionStrategy: this.overlay.position().global(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'landing-lightbox-panel',
    });
    this.overlayRef = ref;
    this.open$.set(true);
    ref.attach(new ComponentPortal(LightboxOverlayComponent, null, this.injector));
  }
}
