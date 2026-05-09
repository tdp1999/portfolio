import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Centered empty-state block: icon (48px) + optional title + message + projected slot for a CTA.
 * Used by sub-pages (blog list, projects index, experience) when their feed is empty,
 * and by the blog-detail "Post not found" fallback (with title + link slot).
 *
 * Usage:
 * ```html
 * <landing-empty-state icon="folder-open" message="No projects published yet" />
 *
 * <landing-empty-state icon="file-x" title="Post not found"
 *   message="This article may have been moved, unpublished, or never existed.">
 *   <a routerLink="/blog" class="text-primary hover:underline">Browse all articles</a>
 * </landing-empty-state>
 * ```
 */
@Component({
  selector: 'landing-empty-state',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <landing-icon [name]="icon()" [size]="48" class="text-text-secondary mb-4" />
      @if (title()) {
        <h2 class="text-body-xl font-semibold text-text mb-2">{{ title() }}</h2>
        <p class="text-text-secondary mb-6">{{ message() }}</p>
      } @else {
        <p class="text-text-secondary text-body-lg">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class LandingEmptyStateComponent {
  readonly icon = input.required<string>();
  readonly message = input.required<string>();
  readonly title = input<string>('');
}
