import { ChangeDetectionStrategy, Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CopyToClipboardDirective, Icon } from '@portfolio/landing/shared/ui';

/**
 * Inline share row used by every blog-detail variant. Three actions:
 * X intent · LinkedIn share-offsite · copy link (via `landingCopyToClipboard`).
 *
 * On server (no `window`), the share URLs degrade to the slug-derived path —
 * production wiring would inject `WINDOW` token or hydrate the absolute URL
 * server-side. Acceptable for DDL.
 */
@Component({
  selector: 'landing-ddl-blog-share-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyToClipboardDirective, Icon],
  template: `
    <div class="share-row" [class.share-row--compact]="compact()" role="group" aria-label="Share">
      <a class="share-row__btn" [href]="xUrl()" target="_blank" rel="noopener noreferrer" aria-label="Share on X">
        <landing-icon name="twitter" [size]="iconSize()" />
        @if (!compact()) {
          <span>X</span>
        }
      </a>
      <a
        class="share-row__btn"
        [href]="linkedInUrl()"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
      >
        <landing-icon name="linkedin" [size]="iconSize()" />
        @if (!compact()) {
          <span>LinkedIn</span>
        }
      </a>
      <button
        type="button"
        class="share-row__btn"
        [landingCopyToClipboard]="absoluteUrl()"
        #copy="landingCopyToClipboard"
        [attr.aria-label]="copy.state() === 'copied' ? 'Link copied' : 'Copy link'"
        [title]="copy.state() === 'copied' ? 'Copied' : 'Copy link'"
      >
        <landing-icon [name]="copy.state() === 'copied' ? 'check' : 'link'" [size]="iconSize()" />
        @if (!compact()) {
          <span>{{ copy.state() === 'copied' ? 'Copied' : 'Copy link' }}</span>
        }
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .share-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .share-row__btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--landing-border);
      border-radius: 4px;
      background: transparent;
      color: var(--landing-text-300);
      text-decoration: none;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-sm);
      cursor: pointer;
      transition:
        border-color 160ms ease,
        color 160ms ease;
    }
    .share-row--compact .share-row__btn {
      padding: 6px;
      width: 32px;
      height: 32px;
      justify-content: center;
      gap: 0;
    }
    .share-row__btn:hover {
      border-color: var(--landing-text-500);
      color: var(--landing-text-100);
    }
  `,
})
export class DdlBlogShareRow {
  private readonly platformId = inject(PLATFORM_ID);

  readonly slug = input.required<string>();
  readonly title = input.required<string>();
  /** Icon-only compact mode — drops the X / LinkedIn / Copy text labels. */
  readonly compact = input<boolean>(false);

  protected readonly iconSize = computed(() => (this.compact() ? 14 : 16));

  readonly absoluteUrl = computed(() => {
    if (isPlatformBrowser(this.platformId)) {
      return `${window.location.origin}/blog/${this.slug()}`;
    }
    return `/blog/${this.slug()}`;
  });

  readonly xUrl = computed(() => {
    const text = encodeURIComponent(this.title());
    const url = encodeURIComponent(this.absoluteUrl());
    return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  });

  readonly linkedInUrl = computed(() => {
    const url = encodeURIComponent(this.absoluteUrl());
    return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  });
}
