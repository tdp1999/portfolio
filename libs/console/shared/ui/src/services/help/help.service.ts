import { computed, Injectable, signal } from '@angular/core';
import type { GuideRef } from './help.types';

/**
 * Which feature guide is open, and which one the current page declares. A page
 * declares its guide through `<console-help-button page>`; the shell's
 * `<console-help-viewer>` reads both to render the window and to answer the `?` key.
 */
@Injectable({ providedIn: 'root' })
export class HelpService {
  // A stack, not a single slot: on navigation the next page registers before the
  // previous one is destroyed, so its unregister must not wipe the new entry.
  private readonly pageGuides = signal<readonly GuideRef[]>([]);
  private readonly openRef = signal<GuideRef | null>(null);

  readonly pageGuide = computed(() => this.pageGuides().at(-1) ?? null);
  readonly opened = this.openRef.asReadonly();

  open(guide: string, section?: string): void {
    this.openRef.set({ guide, section });
  }

  close(): void {
    this.openRef.set(null);
  }

  /** Returns the matching unregister; it removes this one entry only. */
  registerPageGuide(ref: GuideRef): () => void {
    this.pageGuides.update((list) => [...list, ref]);
    return () =>
      this.pageGuides.update((list) => {
        const index = list.lastIndexOf(ref);
        return index === -1 ? list : [...list.slice(0, index), ...list.slice(index + 1)];
      });
  }
}
