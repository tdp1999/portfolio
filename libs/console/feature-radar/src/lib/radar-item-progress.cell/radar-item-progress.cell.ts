import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toClockTime, toCommentsChip } from '../radar-item.util';
import { QUEUE_STATE_ICONS } from '../radar.data';
import type { RadarFeedItem } from '../radar.types';

/**
 * What has been done to one post, as icons in a fixed-width cell: analysis (queue state),
 * comments (capture state and count), images (count and how their stored copies stand) and, for a
 * reel or video, its transcript, so video posts are easy to spot down the list.
 * Tone carries the state, the tooltip spells it out.
 */
@Component({
  selector: 'console-radar-item-progress-cell',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './radar-item-progress.cell.html',
  styleUrl: './radar-item-progress.cell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarItemProgressCell {
  readonly item = input.required<RadarFeedItem>();

  protected readonly analysis = computed(() => {
    const it = this.item();
    const state = QUEUE_STATE_ICONS[it.queueState];
    // A re-queued post keeps its old analysis while it waits for the new one.
    const label = it.queueState === 'pending' && it.enrichment ? 'Re-analysis queued' : state.label;
    if (it.queueState === 'analyzed' && it.enrichment?.factCheckSeverity === 'major') {
      return {
        icon: 'warning',
        tone: 'error',
        label: 'Analyzed: the main claim looks wrong. Open the post for the fact check',
      };
    }
    return { ...state, label };
  });

  protected readonly comments = computed(() => {
    const c = this.item().comments;
    const chip = toCommentsChip(c, this.item().enrichment?.wantsComments ?? false, this.item().source.platform);
    const tone = { FETCHED: 'success', PARTIAL: 'warning', FAILED: 'error', NOT_FETCHED: 'muted' }[c.status];
    const count = c.status === 'NOT_FETCHED' ? c.postCount : c.fetchedCount;
    return { icon: chip.icon, tone, count, label: chip.tooltip, suggested: chip.suggested, empty: count === 0 };
  });

  protected readonly images = computed(() => {
    const { total, pending, failed } = this.item().images;
    if (!total) return { tone: 'muted', total, label: 'No images', empty: true };
    if (failed)
      return {
        tone: 'error',
        total,
        label: `${total} images, ${failed} not saved (the image link can expire)`,
        empty: false,
      };
    if (pending)
      return { tone: 'warning', total, label: `${total} images, ${pending} not copied to storage yet`, empty: false };
    return { tone: 'default', total, label: `${total} ${total === 1 ? 'image' : 'images'}, all saved`, empty: false };
  });

  /** Null for a post without video. A reel captured before video files were kept has no file to transcribe. */
  protected readonly video = computed(() => {
    const { kind, video } = this.item();
    if (!video && kind !== 'REEL' && kind !== 'VIDEO') return null;
    const name = kind === 'REEL' ? 'Reel' : 'Video';
    if (!video) return { tone: 'muted', label: `${name}: no video file captured, so no transcript` };
    const head = video.durationSec === null ? name : `${name} ${toClockTime(video.durationSec)}`;
    return {
      NONE: { tone: 'default', label: `${head}: no transcript, only Auto runs make one` },
      PENDING: { tone: 'warning', label: `${head}: transcript waiting, the AI was busy` },
      DONE: { tone: 'success', label: `${head}: transcript ready` },
      FAILED: { tone: 'error', label: `${head}: no transcript. Open the post for the reason` },
    }[video.transcriptStatus];
  });
}
