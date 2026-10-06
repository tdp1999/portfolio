import { Pipe, PipeTransform } from '@angular/core';
import type { RadarCommentsSummary } from './radar.types';

export interface RadarCommentsChip {
  /** `12 / 40`: kept after filtering / reported by Facebook. Just the Facebook count when not fetched. */
  label: string;
  /** Classes for the cell: a console badge once fetched, plain muted text before. */
  badge: string;
  icon: string;
  tooltip: string;
  /** The analysis suggests fetching them; shown only while they are not fetched. */
  suggested: boolean;
}

/** An item's comment capture state as the Feed's Comments cell shows it. */
@Pipe({ name: 'radarCommentsChip', standalone: true })
export class RadarCommentsChipPipe implements PipeTransform {
  transform(c: RadarCommentsSummary, wantsComments = false): RadarCommentsChip {
    const counted = `${c.fetchedCount} / ${c.postCount}`;
    switch (c.status) {
      case 'FETCHED':
        return {
          label: counted,
          badge: 'console-badge console-badge--muted',
          icon: 'forum',
          tooltip: `${c.fetchedCount} kept of ${c.postCount} on Facebook (spam and filler dropped)`,
          suggested: false,
        };
      case 'PARTIAL':
        return {
          label: counted,
          badge: 'console-badge console-badge--warn',
          icon: 'forum',
          tooltip: 'Partial: the fetch hit its charge cap before this post was read in full',
          suggested: false,
        };
      case 'FAILED':
        return {
          label: 'Failed',
          badge: 'console-badge console-badge--danger',
          icon: 'error_outline',
          tooltip: c.error ? `Fetching comments failed: ${c.error}` : 'Fetching comments failed',
          suggested: wantsComments,
        };
      default:
        return {
          label: String(c.postCount),
          badge: 'radar-comments--idle',
          icon: 'chat_bubble_outline',
          tooltip: wantsComments
            ? `${c.postCount} on Facebook, not fetched. The analysis suggests fetching them.`
            : `${c.postCount} on Facebook, not fetched`,
          suggested: wantsComments,
        };
    }
  }
}
