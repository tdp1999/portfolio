import { Pipe, PipeTransform } from '@angular/core';
import type { RadarBrief, RadarBriefDisplayStatus } from './radar.types';

/** A brief's status as the Owner reads it: who it waits for, and whether writing it failed. */
@Pipe({ name: 'radarBriefStatus', standalone: true })
export class RadarBriefStatusPipe implements PipeTransform {
  transform(brief: Pick<RadarBrief, 'workStatus' | 'writer' | 'error'>): RadarBriefDisplayStatus {
    if (brief.error) return 'FAILED';
    if (brief.workStatus === 'DONE') return 'READY';
    if (brief.workStatus === 'CLAIMED') return 'WRITING';
    return brief.writer === 'AUTO' ? 'QUEUED' : 'WAITING_WORKER';
  }
}
