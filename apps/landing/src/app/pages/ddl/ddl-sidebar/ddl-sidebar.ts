import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { DDL_GROUPS, DDL_REGISTRY, entryNav } from '../ddl.registry';
import type { DdlGroupId } from '../ddl.types';

@Component({
  selector: 'landing-ddl-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './ddl-sidebar.html',
  styleUrl: './ddl-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlSidebar {
  // ──────── State ───────────────────────────────────────────────────────
  private readonly collapsed = signal<ReadonlySet<DdlGroupId>>(new Set());

  // ──────── Derived ─────────────────────────────────────────────────────
  // Groups in sidebar order, each with its entries; empty groups drop. Deprecated
  // entries are hidden from the rail (still reachable by direct URL, where the page
  // shows its "Deprecated" chip) so the nav reflects only living docs.
  private readonly groups = DDL_GROUPS.map((group) => ({
    ...group,
    entries: DDL_REGISTRY.filter((entry) => entry.group === group.id && entry.status !== 'deprecated').map(entryNav),
  })).filter((group) => group.entries.length > 0);

  /** The groups with their open/closed state, so the template only reads fields. */
  protected readonly visibleGroups = computed(() => {
    const collapsed = this.collapsed();
    return this.groups.map((group) => ({ ...group, collapsed: collapsed.has(group.id) }));
  });

  // ──────── Methods ─────────────────────────────────────────────────────
  protected toggleGroup(id: DdlGroupId): void {
    const next = new Set(this.collapsed());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.collapsed.set(next);
  }
}
