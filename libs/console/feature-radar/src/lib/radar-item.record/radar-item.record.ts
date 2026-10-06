import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  EnumLabelPipe,
  Property,
  PropertyList,
  QuickLook,
  RecordField,
  RecordFold,
  RecordLayout,
  RecordPanel,
  RecordSection,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, finalize, last, switchMap, take, takeWhile, tap, timer } from 'rxjs';
import { MarkdownPipe } from '../markdown.pipe';
import { RadarCommentsChipPipe } from '../radar-comments-chip.pipe';
import { RadarImageViewablePipe } from '../radar-image-viewable.pipe';
import { isViewableImage } from '../radar-item.util';
import { COMMENTS_POLL_MAX, COMMENTS_POLL_MS } from '../radar.constants';
import { CONTENT_TYPE_LABELS, PROVIDER_LABELS, WORK_STATUS_LABELS } from '../radar.data';
import { RadarService } from '../radar.service';
import { RadarCommentLabel, RadarItemDetail, RadarItemImage } from '../radar.types';
import { UrlHostPipe } from '../url-host.pipe';

/** Only the exceptions carry a badge: kept comments are substantive by default (spam is filtered at capture). */
const COMMENT_TAGS: Record<RadarCommentLabel, { text: string; badge: string } | null> = {
  author: null,
  substantive: null,
  low: { text: 'Filler', badge: 'console-badge console-badge--muted' },
  spam: { text: 'Spam', badge: 'console-badge console-badge--danger' },
};

/** What Quick Look needs of an image: a post photo or a comment's image. */
type LightboxPhoto = Pick<RadarItemImage, 'url' | 'ocrText'>;

/** Other comments shown before "Show more": enough to judge the thread without scrolling past it.
 *  One extra comment is shown rather than hidden behind a "Show 1 more" button. */
const COMMENTS_PREVIEW = 3;

/**
 * One post and everything the worker wrote about it, on the record chassis (ADR-026). Shared by
 * the Detail page and the Feed's Split pane; the host owns the header, loading and navigation.
 * The post leads on its own surface, the AI analysis follows, and attachments (images, links)
 * sit in the rail. The worker's fact check shows only when its severity is major.
 * Inside a pane, wrap it in `.rv-pane` so the property rail follows the pane's width.
 */
@Component({
  selector: 'console-radar-item-record',
  standalone: true,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    EnumLabelPipe,
    MarkdownPipe,
    RadarImageViewablePipe,
    RadarCommentsChipPipe,
    UrlHostPipe,
    Property,
    PropertyList,
    QuickLook,
    RecordField,
    RecordFold,
    RecordLayout,
    RecordPanel,
    RecordSection,
  ],
  templateUrl: './radar-item.record.html',
  styleUrl: './radar-item.record.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarItemRecord {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Inputs / outputs ──────────────────────────────────────────────
  readonly item = input.required<RadarItemDetail>();
  /** A comments fetch ended: the host reloads this item id if it still shows it. */
  readonly refresh = output<string>();

  // ── Writable signals ──────────────────────────────────────────────
  /** The item whose comments are being fetched; the pane can move on while it runs. */
  private readonly fetchingId = signal<string | null>(null);
  /** Image URLs the browser could not load (an expired provider link, a pending copy). */
  protected readonly brokenImages = signal<ReadonlySet<string>>(new Set());
  /** The photos of one gallery (the post's, the shared post's or one comment's) and the one open in Quick Look. Closes on a new item. */
  protected readonly lightbox = linkedSignal<string, { photos: LightboxPhoto[]; index: number } | null>({
    source: () => this.item().id,
    computation: () => null,
  });
  protected readonly allCommentsShown = linkedSignal({ source: () => this.item().id, computation: () => false });
  protected readonly keyTermsOpen = linkedSignal({ source: () => this.item().id, computation: () => false });

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly fetchingComments = computed(() => this.fetchingId() === this.item().id);

  /** The post's own media, then the shared post's: two galleries in the rail, each with its own Quick Look. */
  protected readonly images = computed(() => this.item().images);
  protected readonly sharedImages = computed(() => this.item().sharedPost?.images ?? []);
  protected readonly imageCount = computed(() => this.images().length + this.sharedImages().length);

  /** The shared post's permalink already sits next to its text as "Open shared post"; every other link stays. */
  protected readonly links = computed(() => {
    const it = this.item();
    const summaries = it.enrichment?.linkSummaries ?? [];
    return it.links
      .filter((l) => l.url !== it.sharedPost?.permalink)
      .map((l) => ({ ...l, summary: summaries.find((s) => s.url === l.url)?.summary ?? null }));
  });

  /** Stored comments with their label's text and badge resolved once (the comment template is untyped). */
  private readonly commentRows = computed(() =>
    this.item().comments.items.map((c) => ({ ...c, tag: COMMENT_TAGS[c.label] }))
  );
  /** The author's own comments carry the links and screenshots the post points to: shown in the post card. */
  protected readonly authorComments = computed(() => this.commentRows().filter((c) => c.isAuthor));
  /** Everyone else, best first as stored; spam and filler stay visible but marked. */
  protected readonly otherComments = computed(() => this.commentRows().filter((c) => !c.isAuthor));
  protected readonly shownComments = computed(() =>
    this.allCommentsShown() || this.otherComments().length <= COMMENTS_PREVIEW + 1
      ? this.otherComments()
      : this.otherComments().slice(0, COMMENTS_PREVIEW)
  );
  protected readonly hiddenCommentCount = computed(() => this.otherComments().length - this.shownComments().length);
  /** Nothing to show or fetch when Facebook reports no comments and none were ever fetched. */
  protected readonly hasComments = computed(() => {
    const c = this.item().comments;
    return c.postCount > 0 || c.status !== 'NOT_FETCHED';
  });
  /** The Key terms fold's gist: the bold names that open each bullet of `context`. */
  protected readonly keyTermsGist = computed(() => {
    const context = this.item().enrichment?.context ?? '';
    return [...context.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]).join(', ');
  });

  protected readonly providerNames = computed(() =>
    (this.item().enrichment?.providerTags ?? []).map((t) => PROVIDER_LABELS[t] ?? t).join(', ')
  );

  protected readonly lightboxPhoto = computed(() => {
    const lb = this.lightbox();
    return lb ? lb.photos[lb.index] : null;
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly workStatusLabels = WORK_STATUS_LABELS;
  protected readonly contentTypeLabels = CONTENT_TYPE_LABELS;
  private destroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => (this.destroyed = true));
  }

  /**
   * Billed on Apify (capped per call), so it asks first. Starts the job, then polls until it ends:
   * no request waits on Apify. The poll outlives the view on purpose, so leaving mid-fetch still
   * stores the comments that were paid for.
   */
  onFetchComments(): void {
    const it = this.item();
    this.radarService
      .commentsSettings()
      .pipe(
        switchMap((settings) =>
          this.dialog
            .open(ConfirmDialogComponent, {
              data: {
                title: it.comments.status === 'NOT_FETCHED' ? 'Fetch comments' : 'Fetch comments again',
                message: `Read up to ${settings.itemTopLevelLimit} top comments of this post (${it.comments.postCount} on Facebook) and their replies with Apify. This is billed, at most $${settings.itemMaxChargeUsd}, and replaces the comments stored now.`,
                confirmLabel: 'Fetch',
              } satisfies ConfirmDialogData,
            })
            .afterClosed()
        ),
        filter(Boolean),
        tap(() => this.fetchingId.set(it.id)),
        switchMap(() => this.radarService.fetchComments(it.id)),
        switchMap((started) =>
          timer(COMMENTS_POLL_MS, COMMENTS_POLL_MS).pipe(
            take(COMMENTS_POLL_MAX),
            switchMap(() => this.radarService.collectComments(it.id, started.jobRef)),
            takeWhile((r) => r.state === 'running', true),
            last()
          )
        ),
        finalize(() => {
          if (this.fetchingId() === it.id) this.fetchingId.set(null);
          if (!this.destroyed) this.refresh.emit(it.id);
        })
      )
      // An error is toasted by the API layer; finalize still asks for a reload to show FAILED.
      .subscribe({
        next: (r) => {
          if (r.state === 'running') this.toast.warning('Comments are still being fetched; reload this page later');
          else if (r.status === 'PARTIAL')
            this.toast.warning(`Fetched ${r.fetchedCount} comments; the cap stopped it early`);
          else this.toast.success(`Fetched ${r.fetchedCount} comments`);
        },
        error: () => undefined,
      });
  }

  onImageError(url: string): void {
    this.brokenImages.update((set) => new Set(set).add(url));
  }

  onOpenImage(gallery: RadarItemImage[], image: RadarItemImage): void {
    const photos = gallery.filter((img) => isViewableImage(img, this.brokenImages()));
    this.lightbox.set({ photos, index: Math.max(0, photos.indexOf(image)) });
  }

  /** A comment's images are always photos: only the ones seen failing to load are left out. */
  onOpenCommentImage(images: LightboxPhoto[], image: LightboxPhoto): void {
    const photos = images.filter((img) => !this.brokenImages().has(img.url));
    this.lightbox.set({ photos, index: Math.max(0, photos.indexOf(image)) });
  }

  onLightboxOpenChange(open: boolean): void {
    if (!open) this.lightbox.set(null);
  }

  onLightboxStep(delta: -1 | 1): void {
    this.lightbox.update((lb) =>
      lb ? { ...lb, index: Math.min(lb.photos.length - 1, Math.max(0, lb.index + delta)) } : null
    );
  }
}
