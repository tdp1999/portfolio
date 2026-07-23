import { computed, signal } from '@angular/core';

/**
 * Which folds are open on a record page. Pure UI state with no domain
 * knowledge, so every detail page shares one implementation instead of
 * re-deriving a `Set<string>` and four helpers.
 *
 * ```ts
 * protected readonly folds = new RecordExpansion();
 * // template: [open]="folds.isOpen(id)" (openChange)="folds.toggle(id)"
 * ```
 *
 * `toggleGroup` is scoped **on purpose**: an "Expand all" control lives in one
 * section's header, so it must not reach across into a sibling section.
 */
export class RecordExpansion {
  private readonly open = signal<ReadonlySet<string>>(new Set());

  readonly openIds = computed(() => [...this.open()]);

  isOpen(id: string): boolean {
    return this.open().has(id);
  }

  toggle(id: string): void {
    const next = new Set(this.open());
    if (!next.delete(id)) next.add(id);
    this.open.set(next);
  }

  allOpenIn(ids: readonly string[]): boolean {
    return ids.length > 0 && ids.every((id) => this.open().has(id));
  }

  /** Open every id in the group, or close them all if they are already open. */
  toggleGroup(ids: readonly string[]): void {
    const next = new Set(this.open());
    if (this.allOpenIn(ids)) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    this.open.set(next);
  }

  collapseAll(): void {
    this.open.set(new Set());
  }
}
