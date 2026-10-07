import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RecordField, RecordFold } from '@portfolio/console/shared/ui';
import { TRANSCRIPT_STATUS_GISTS } from '../radar.data';
import { RadarItemVideo } from '../radar.types';
import { toClockTime } from '../radar-item.util';

/**
 * The transcript of the post's video (task 421): what the video says, the text it shows and what it
 * shows, written by the server AI in an AUTO run before the analysis. Folded under the post: the
 * analysis already reads it, so the Owner opens it only to check a claim.
 */
@Component({
  selector: 'console-radar-item-transcript-section',
  standalone: true,
  imports: [RecordField, RecordFold],
  templateUrl: './radar-item-transcript.section.html',
  styleUrl: './radar-item-transcript.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarItemTranscriptSection {
  readonly video = input.required<RadarItemVideo>();

  /** Length first, then what the transcript holds or why there is none. */
  protected readonly gist = computed(() => {
    const v = this.video();
    const length = v.durationSec === null ? null : toClockTime(v.durationSec);
    const status = v.transcriptStatus;
    let state: string;
    if (status === 'DONE') {
      state = v.transcript?.spoken ? 'Speech transcribed' : 'No speech, visuals described';
    } else if (status === 'FAILED') {
      state = `No transcript: ${v.transcriptError ?? 'unknown reason'}`;
    } else {
      state = TRANSCRIPT_STATUS_GISTS[status];
    }
    return length ? `${length} · ${state}` : state;
  });
}
