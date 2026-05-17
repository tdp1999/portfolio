import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { buildCloudinarySrcset } from '@portfolio/landing/shared/util';

/**
 * Browser-window chrome (3-dot traffic lights + URL bar) wrapping a screenshot or
 * projected content. Per E4 imagery rules — device frames are banned; browser chrome
 * is the only allowed beautification for app shots.
 *
 * ```html
 * <!-- With src input: -->
 * <landing-browser-window [src]="project.thumbnailUrl" [alt]="project.title" [url]="project.slug" />
 *
 * <!-- Or with projected content: -->
 * <landing-browser-window url="docs.example.com">
 *   <iframe src="..." />
 * </landing-browser-window>
 * ```
 */
@Component({
  selector: 'landing-browser-window',
  standalone: true,
  template: `
    <div class="lbw">
      <div class="lbw__chrome">
        <span class="lbw__dot lbw__dot--red" aria-hidden="true"></span>
        <span class="lbw__dot lbw__dot--amber" aria-hidden="true"></span>
        <span class="lbw__dot lbw__dot--green" aria-hidden="true"></span>
        @if (url()) {
          <span class="lbw__url">{{ url() }}</span>
        }
      </div>
      @if (src()) {
        <img
          class="lbw__shot"
          [src]="resolvedSrc()"
          [attr.srcset]="resolvedSrcset() || null"
          [alt]="alt()"
          [attr.loading]="eager() ? 'eager' : 'lazy'"
          [attr.fetchpriority]="eager() ? 'high' : null"
          [attr.decoding]="eager() ? 'sync' : 'async'"
        />
      } @else {
        <div class="lbw__body">
          <ng-content />
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .lbw {
        background: var(--landing-ink-1);
        border: 1px solid var(--landing-border);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 24px 64px -32px rgba(0, 0, 0, 0.45);
      }
      .lbw__chrome {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--landing-border);
        background: var(--landing-ink-0);
      }
      .lbw__dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--landing-border);
      }
      .lbw__dot--red {
        background: #ef4444;
      }
      .lbw__dot--amber {
        background: #f59e0b;
      }
      .lbw__dot--green {
        background: #22c55e;
      }
      .lbw__url {
        margin-left: 16px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        letter-spacing: var(--landing-tracking-mono);
        color: var(--landing-text-500);
        text-transform: lowercase;
      }
      .lbw__shot {
        display: block;
        width: 100%;
        height: auto;
      }
      .lbw__body {
        background: var(--landing-ink-0);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingBrowserWindowComponent {
  /** Screenshot source URL. Omit to use projected content instead. */
  readonly src = input<string | null>(null);
  readonly alt = input<string>('');
  /** Text shown in the fake URL bar (e.g. project slug or domain). */
  readonly url = input<string>('');
  /** Mark as above-the-fold for priority loading. Default `false` (lazy). */
  readonly eager = input<boolean>(false);
  /**
   * Rendered CSS width of the image in px (max). Used to compute a 1×/2× Cloudinary
   * `srcset`. Non-Cloudinary URLs fall back to the plain `src` (empty srcset).
   * Default 960 — the wide-container cap used by the project-detail hero.
   */
  readonly width = input<number>(960);

  protected readonly resolvedSet = computed(() => buildCloudinarySrcset(this.src(), this.width()));
  protected readonly resolvedSrc = computed(() => this.resolvedSet().src || this.src() || '');
  protected readonly resolvedSrcset = computed(() => this.resolvedSet().srcset);
}
