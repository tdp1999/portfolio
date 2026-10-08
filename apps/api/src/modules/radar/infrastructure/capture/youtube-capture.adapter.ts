import { RadarPlatform } from '@prisma/client';

import { isPlainObject, nonEmptyString } from '@portfolio/shared/utils';

import {
  CaptureJobRequest,
  CaptureJobStart,
  CaptureJobStatus,
  ICaptureProvider,
  ResolvedSource,
} from '../../application/ports/capture-provider.port';
import { RadarCaptureConfig } from '../../application/radar-capture.config';
import { YouTubeApiError, YouTubeClient } from './youtube.client';
import { YOUTUBE_VIDEOS_FORMAT } from './youtube.normalizer';

/** What `start` hands to `poll`: the request itself, since listing happens on the first poll. */
interface YouTubeJob {
  channelId: string;
  from: string | null;
  to: string | null;
  cap: number;
}

/**
 * Capture of a YouTube channel through the Data API v3. There is no job on YouTube's side, so the
 * job is ours: `start` records the request, the first `poll` lists the channel's uploads playlist
 * inside the window (newest first, stopping at the first page that reaches past the window start
 * or at the item cap) and hands the video ids over as the dataset, which the run keeps in its step
 * meta. `fetchPage` then reads those videos with `videos.list`. A window costs about one quota unit
 * per 50 videos listed and one per 50 videos read, out of 10,000 a day.
 */
export class YouTubeCaptureAdapter implements ICaptureProvider {
  // --- Constants ---

  readonly name = 'youtube';
  readonly format = YOUTUBE_VIDEOS_FORMAT;
  readonly platform = RadarPlatform.YOUTUBE;
  readonly credentialName = 'YOUTUBE_API_KEY';

  /** The API's own page size, for both `playlistItems` and `videos`. */
  private static readonly PAGE = 50;
  /** 2,000 uploads: a bound on a channel that posts far more than the window needs. */
  private static readonly MAX_LIST_PAGES = 40;
  private static readonly CHANNEL_ID = /^UC[\w-]{22}$/;
  private static readonly HANDLE = /^@[\w.-]{3,100}$/;

  private readonly client: YouTubeClient;

  constructor(config: RadarCaptureConfig, http?: typeof fetch) {
    this.client = new YouTubeClient(config.youtubeApiKey, http);
  }

  isConfigured(): boolean {
    return this.client.isConfigured;
  }

  /** A channel URL (`/channel/UC…`, `/@handle`, `/user/name`) or a bare `@handle`, to the canonical channel URL. */
  async resolveSource(url: string): Promise<ResolvedSource | null> {
    const ref = YouTubeCaptureAdapter.channelRef(url);
    if (!ref) return null;
    const { items } = await this.client.list('channels', { part: 'snippet', ...ref });
    const channel = items.find(isPlainObject);
    const id = channel && nonEmptyString(channel['id']);
    if (!channel || !id) return null;
    const snippet = isPlainObject(channel['snippet']) ? channel['snippet'] : {};
    return { url: YouTubeCaptureAdapter.channelUrl(id), name: nonEmptyString(snippet['title']) ?? id };
  }

  async start(request: CaptureJobRequest): Promise<CaptureJobStart> {
    const channelId = YouTubeCaptureAdapter.channelIdOf(request.sourceUrl);
    if (!channelId) throw new Error(`Not a YouTube channel URL: ${request.sourceUrl}`);
    const job: YouTubeJob = {
      channelId,
      from: request.windowFrom?.toISOString() ?? null,
      to: request.windowTo?.toISOString() ?? null,
      cap: request.itemCap,
    };
    // The job runs on the first poll; the reference carries everything it needs.
    return { jobRef: JSON.stringify(job), input: { ...job } };
  }

  async poll(jobRef: string): Promise<CaptureJobStatus> {
    const job = JSON.parse(jobRef) as YouTubeJob;
    try {
      const uploads = await this.uploadsPlaylist(job.channelId);
      if (!uploads) return { state: 'failed', message: `YouTube has no channel ${job.channelId}` };
      const ids = await this.videoIdsInWindow(uploads, job);
      return { state: 'succeeded', datasetRef: ids.join(','), itemCount: ids.length };
    } catch (error) {
      // A channel that never uploaded has no uploads playlist to list: nothing to capture, not a failure.
      if (error instanceof YouTubeApiError && error.reason === 'playlistNotFound') {
        return { state: 'succeeded', datasetRef: '', itemCount: 0 };
      }
      const message = YouTubeCaptureAdapter.finalMessage(error);
      if (message) return { state: 'failed', message };
      throw error;
    }
  }

  /** The dataset is the comma-separated video ids `poll` listed; a page reads its slice of them. */
  async fetchPage(datasetRef: string, offset: number, limit: number): Promise<unknown[]> {
    const ids = datasetRef ? datasetRef.split(',').slice(offset, offset + limit) : [];
    const videos: unknown[] = [];
    for (let i = 0; i < ids.length; i += YouTubeCaptureAdapter.PAGE) {
      const { items } = await this.client.list('videos', {
        part: 'snippet,contentDetails,statistics,status',
        id: ids.slice(i, i + YouTubeCaptureAdapter.PAGE).join(','),
        maxResults: String(YouTubeCaptureAdapter.PAGE),
      });
      videos.push(...items);
    }
    return videos;
  }

  // --- Private ---

  private async uploadsPlaylist(channelId: string): Promise<string | null> {
    const { items } = await this.client.list('channels', { part: 'contentDetails', id: channelId });
    const channel = items.find(isPlainObject);
    const details = channel && isPlainObject(channel['contentDetails']) ? channel['contentDetails'] : {};
    const playlists = isPlainObject(details['relatedPlaylists']) ? details['relatedPlaylists'] : {};
    return nonEmptyString(playlists['uploads']);
  }

  /**
   * Newest first. A video newer than the window is passed over, one older marks the end: the page
   * it is on is read to its end (upload order and publish order can differ by a little), then
   * listing stops.
   */
  private async videoIdsInWindow(playlistId: string, job: YouTubeJob): Promise<string[]> {
    const from = job.from ? Date.parse(job.from) : null;
    const to = job.to ? Date.parse(job.to) : null;
    const ids: string[] = [];
    let pageToken: string | null = null;

    for (let page = 0; page < YouTubeCaptureAdapter.MAX_LIST_PAGES; page++) {
      const params: Record<string, string> = {
        part: 'contentDetails',
        playlistId,
        maxResults: String(YouTubeCaptureAdapter.PAGE),
      };
      if (pageToken) params['pageToken'] = pageToken;
      const { items, nextPageToken } = await this.client.list('playlistItems', params);

      let pastWindow = false;
      for (const item of items) {
        const details = isPlainObject(item) && isPlainObject(item['contentDetails']) ? item['contentDetails'] : {};
        const id = nonEmptyString(details['videoId']);
        // A private or deleted upload has no publish time; `videos.list` would not return it anyway.
        const at = Date.parse(nonEmptyString(details['videoPublishedAt']) ?? '');
        if (!id || Number.isNaN(at) || ids.includes(id)) continue;
        if (to !== null && at > to) continue;
        if (from !== null && at < from) {
          pastWindow = true;
          continue;
        }
        ids.push(id);
        if (ids.length >= job.cap) return ids;
      }
      if (pastWindow || !nextPageToken) return ids;
      pageToken = nextPageToken;
    }
    return ids;
  }

  /** A refusal a retry cannot fix, worded for the run; null for anything worth another tick. */
  private static finalMessage(error: unknown): string | null {
    if (!(error instanceof YouTubeApiError)) return null;
    if (error.quotaExhausted) return 'The YouTube API daily quota is used up; it resets at midnight Pacific time';
    if (error.status === 404) return `YouTube could not find the channel's uploads: ${error.message}`;
    if (error.keyRejected) return `YouTube refused the API key: ${error.message}`;
    if (error.requestRejected) return `YouTube refused the request: ${error.message}`;
    return null;
  }

  private static channelUrl(id: string): string {
    return `https://www.youtube.com/channel/${id}`;
  }

  /** The channel id in a canonical channel URL, the form a YouTube source is stored in. */
  private static channelIdOf(url: string): string | null {
    const ref = YouTubeCaptureAdapter.channelRef(url);
    return ref && 'id' in ref ? ref.id : null;
  }

  /** The `channels.list` filter a pasted value points at: a channel id, a handle or a legacy username. A `/c/` custom URL has no API lookup. */
  private static channelRef(value: string): { id: string } | { forHandle: string } | { forUsername: string } | null {
    const trimmed = value.trim();
    if (YouTubeCaptureAdapter.HANDLE.test(trimmed)) return { forHandle: trimmed };
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }
    if (!/(^|\.)youtube\.com$/.test(url.hostname)) return null;
    const [first, second] = url.pathname.split('/').filter(Boolean);
    if (first === 'channel' && second && YouTubeCaptureAdapter.CHANNEL_ID.test(second)) return { id: second };
    if (first === 'user' && second) return { forUsername: decodeURIComponent(second) };
    if (first && YouTubeCaptureAdapter.HANDLE.test(decodeURIComponent(first))) {
      return { forHandle: decodeURIComponent(first) };
    }
    return null;
  }
}
