import { booleanAttribute, ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HelpService } from '../../services/help/help.service';

/**
 * (?) entry point to a feature guide. `page` marks the page-header button: it is
 * larger and registers the guide (and section) as the page's own, so the `?` key
 * opens it there. Without
 * `page` it is a small contextual link, usually with a `section` deep link (a column
 * header, a field label). Pages without a guide simply do not render one.
 */
@Component({
  selector: 'console-help-button',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './help-button.html',
  styleUrl: './help-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpButton {
  private readonly help = inject(HelpService);

  /** Slug of `/guides/<slug>.html`. */
  readonly guide = input.required<string>();
  /** Element id inside the guide to open at. */
  readonly section = input<string>();
  readonly page = input(false, { transform: booleanAttribute });
  readonly label = input('Feature guide');

  protected readonly tooltip = computed(() => (this.page() ? `${this.label()} (?)` : this.label()));

  constructor() {
    effect((onCleanup) => {
      if (!this.page()) return;
      onCleanup(this.help.registerPageGuide({ guide: this.guide(), section: this.section() }));
    });
  }

  // Stop the click and its keyboard twins: these buttons sit inside sortable headers
  // and clickable rows, which must not react to them.
  onActivate(event: Event): void {
    event.stopPropagation();
    this.help.open(this.guide(), this.section());
  }
}
