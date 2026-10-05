import { Pipe, PipeTransform } from '@angular/core';

/**
 * `set | setHas: value` — membership test for template bindings such as row selection.
 * Pure: it re-runs only when the set reference changes, so update the set immutably.
 */
@Pipe({ name: 'setHas', standalone: true })
export class SetHasPipe implements PipeTransform {
  transform<T>(set: ReadonlySet<T>, value: T): boolean {
    return set.has(value);
  }
}
