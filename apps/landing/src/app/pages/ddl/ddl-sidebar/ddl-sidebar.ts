import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { DDL_GROUPS, DDL_REGISTRY, entryFragment, entryIsRoute, entryLink } from '../ddl.registry';
import type { DdlEntry, DdlGroupId } from '../ddl.types';

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
  protected readonly visibleGroups = computed(() =>
    DDL_GROUPS.map((group) => ({
      ...group,
      entries: DDL_REGISTRY.filter((entry) => entry.group === group.id && entry.status !== 'deprecated'),
    })).filter((group) => group.entries.length > 0)
  );

  // ──────── Methods ─────────────────────────────────────────────────────
  protected isCollapsed(id: DdlGroupId): boolean {
    return this.collapsed().has(id);
  }

  protected toggleGroup(id: DdlGroupId): void {
    const next = new Set(this.collapsed());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.collapsed.set(next);
  }

  protected isRoute(entry: DdlEntry): boolean {
    return entryIsRoute(entry);
  }

  protected linkFor(entry: DdlEntry): string {
    return entryLink(entry);
  }

  protected fragmentFor(entry: DdlEntry): string | undefined {
    return entryFragment(entry);
  }
}
