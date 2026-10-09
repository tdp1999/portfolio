import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { Select, type SelectOption } from '@portfolio/landing/shared/ui';

/**
 * Pick one role to see your part of the run: rows that do not involve it dim, they never disappear.
 * A dropdown rather than a chip per role: eight long Vietnamese role names spread as chips take
 * two lines; the menu also shows how many tasks each role touches.
 */
@Component({
  selector: 'landing-checklist-role-filter',
  imports: [Select],
  template: `
    <landing-select
      [options]="options()"
      [value]="active() ?? allRoles"
      (valueChange)="active.set($event || null)"
      triggerIconName="filter"
      sublabelAlign="end"
      ariaLabel="Filter by role"
    />
  `,
  styleUrl: './checklist.role-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistRoleFilter {
  readonly roles = input.required<readonly string[]>();
  /** Tasks per role, shown under each option; a role missing from the map shows no count. */
  readonly counts = input<ReadonlyMap<string, number>>(new Map());
  readonly active = model<string | null>(null);

  /** The "no filter" option's value: `landing-select` needs a value for every option. */
  protected readonly allRoles = '';
  protected readonly options = computed<SelectOption[]>(() => [
    { value: this.allRoles, label: 'All roles' },
    ...this.roles().map((role) => {
      const count = this.counts().get(role);
      return {
        value: role,
        label: role,
        sublabel: count === undefined ? undefined : `${count} ${count === 1 ? 'task' : 'tasks'}`,
      };
    }),
  ]);
}
