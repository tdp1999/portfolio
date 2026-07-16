import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Empty-state display with two variants:
 *
 * - `variant="block"` (default): centered icon (48px) + optional title + message +
 *   projected slot for a CTA. For full-page feeds (blog list, projects index) and the
 *   blog-detail "Post not found" fallback (with title + link slot).
 * - `variant="inline"`: compact, left-aligned "coming soon" note (optional 20px icon +
 *   muted message) that sits inside an in-page section without the big centered block.
 *   For the home "Selected work" panel and the About sections when their data is empty.
 *
 * `icon` is optional — omit it for a text-only note.
 *
 * Usage:
 * ```html
 * <landing-empty-state icon="folder-open" message="No projects published yet" />
 *
 * <landing-empty-state icon="file-x" title="Post not found"
 *   message="This article may have been moved, unpublished, or never existed.">
 *   <a routerLink="/blog" class="text-primary hover:underline">Browse all articles</a>
 * </landing-empty-state>
 *
 * <landing-empty-state variant="inline" message="Principles coming soon." />
 * ```
 */
@Component({
  selector: 'landing-empty-state',
  standalone: true,
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'inline') {
      <div class="flex items-center gap-2 py-8">
        @if (icon()) {
          <landing-icon [name]="icon()" [size]="20" class="text-text-secondary shrink-0" />
        }
        <p class="text-text-secondary text-body-md">{{ message() }}</p>
      </div>
    } @else {
      <div class="flex flex-col items-center justify-center py-24 text-center">
        @if (icon()) {
          <landing-icon [name]="icon()" [size]="48" class="text-text-secondary mb-4" />
        }
        @if (title()) {
          <h2 class="text-body-xl font-semibold text-text mb-2">{{ title() }}</h2>
          <p class="text-text-secondary mb-6">{{ message() }}</p>
        } @else {
          <p class="text-text-secondary text-body-lg">{{ message() }}</p>
        }
        <ng-content />
      </div>
    }
  `,
})
export class EmptyState {
  readonly icon = input<string>('');
  readonly message = input.required<string>();
  readonly title = input<string>('');
  readonly variant = input<'block' | 'inline'>('block');
}
