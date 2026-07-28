import { ChangeDetectionStrategy, Component, computed, inject, input, PLATFORM_ID, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CopyToClipboardDirective, Icon, UmamiEventDirective, resolveCopy } from '@portfolio/landing/shared/ui';
import type { Locale } from '@portfolio/shared/types';

/**
 * Share row for the blog detail page. Three actions:
 * X intent · LinkedIn share-offsite · copy link (via `landingCopyToClipboard`).
 * Compact mode collapses to 32×32 icon-only buttons.
 *
 * On server (no `window`), the share URLs degrade to the slug-derived path —
 * crawlers re-render once hydrated. Acceptable for share intents that are
 * only ever clicked client-side.
 */
@Component({
  selector: 'landing-blog-share-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyToClipboardDirective, Icon, UmamiEventDirective],
  template: `
    <div class="share-row" [class.share-row--compact]="compact()" role="group" [attr.aria-label]="shareLabel()">
      <a
        class="share-row__btn"
        [href]="xUrl()"
        target="_blank"
        rel="noopener noreferrer"
        [attr.aria-label]="shareXLabel()"
        umamiEvent="blog-share"
        [umamiData]="{ channel: 'x' }"
      >
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
        [attr.aria-label]="shareLinkedInLabel()"
        umamiEvent="blog-share"
        [umamiData]="{ channel: 'linkedin' }"
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
        [attr.aria-label]="announcedCopyLabel()"
        [title]="visibleCopyLabel()"
        umamiEvent="blog-share"
        [umamiData]="{ channel: 'copy' }"
      >
        <landing-icon [name]="copied() ? 'check' : 'link'" [size]="iconSize()" />
        @if (!compact()) {
          <span>{{ visibleCopyLabel() }}</span>
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
export class BlogShareRow {
  private readonly platformId = inject(PLATFORM_ID);

  readonly slug = input.required<string>();
  readonly title = input.required<string>();
  /** Icon-only compact mode — drops the X / LinkedIn / Copy text labels. */
  readonly compact = input<boolean>(false);
  /** The post's own language, passed down so the whole page reads in one language. */
  readonly locale = input<Locale>('en');

  protected readonly iconSize = computed(() => (this.compact() ? 14 : 16));
  protected readonly shareLabel = computed(() => resolveCopy('blog.share.group', this.locale()));
  protected readonly shareXLabel = computed(() => resolveCopy('blog.share.x', this.locale()));
  protected readonly shareLinkedInLabel = computed(() => resolveCopy('blog.share.linkedin', this.locale()));

  /**
   * The clipboard state, lifted out of the template.
   *
   * It used to be read through a `#copy="landingCopyToClipboard"` template
   * reference, which forced the two labels below to be *methods* — and a method
   * in a binding re-runs on every change-detection pass, not just when the
   * language or the copy state changes. Querying the directive turns both into
   * memoized computeds instead. Optional rather than `required` because a signal
   * query is still empty during the first pass.
   */
  private readonly clipboard = viewChild(CopyToClipboardDirective);
  protected readonly copied = computed(() => this.clipboard()?.state() === 'copied');

  /**
   * Visible label: `Copy link` → `Copied`. Announced label: `Copy link` →
   * `Link copied`. Deliberately different in the copied state, because a screen
   * reader hears it without the check icon that makes the short form obvious.
   */
  protected readonly visibleCopyLabel = computed(() =>
    resolveCopy(this.copied() ? 'common.copied' : 'common.copyLink', this.locale())
  );
  protected readonly announcedCopyLabel = computed(() =>
    resolveCopy(this.copied() ? 'blog.share.copied' : 'common.copyLink', this.locale())
  );

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
