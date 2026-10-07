import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toCommentsChip } from '../radar-item.util';
import { QUEUE_STATE_ICONS } from '../radar.data';
import type { RadarFeedItem } from '../radar.types';

/**
 * What has been done to one post, as three icons in a fixed-width cell: analysis (queue state),
 * comments (capture state and count) and images (count and how their stored copies stand).
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
    const label = it.queueState === 'pending' && it.enrichment ? 'Waiting for re-analysis' : state.label;
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
    const chip = toCommentsChip(c, this.item().enrichment?.wantsComments ?? false);
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
        label: `${total} images, ${failed} not saved (the Facebook link can expire)`,
        empty: false,
      };
    if (pending)
      return { tone: 'warning', total, label: `${total} images, ${pending} not copied to storage yet`, empty: false };
    return { tone: 'default', total, label: `${total} ${total === 1 ? 'image' : 'images'}, all saved`, empty: false };
  });
}
