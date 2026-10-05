import { servedUrl } from '../domain/radar-media.util';
import { RadarMedia } from '../domain/radar.types';
import { ClaimedRadarItem } from './ports/radar-work.repository.port';
import { RadarSourceWithCount } from './ports/radar-source.repository.port';
import { RadarSourceResponseDto, RadarWorkImageDto, RadarWorkItemDto } from './radar.dto';

const toImages = (media: RadarMedia[]): RadarWorkImageDto[] =>
  media.map((m) => ({ type: m.type, url: servedUrl(m), ocrText: m.ocrText }));

export class RadarPresenter {
  static toSource(source: RadarSourceWithCount): RadarSourceResponseDto {
    return {
      id: source.id,
      platform: source.platform,
      url: source.url,
      displayName: source.displayName,
      isActive: source.isActive,
      itemCount: source.itemCount,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }

  static toWorkItem(item: ClaimedRadarItem): RadarWorkItemDto {
    return {
      id: item.id,
      kind: item.kind,
      permalink: item.permalink,
      authorName: item.authorName,
      publishedAt: item.publishedAt,
      text: item.text,
      images: toImages(item.media),
      links: item.links,
      sharedPost: item.sharedPost && {
        authorName: item.sharedPost.authorName,
        permalink: item.sharedPost.permalink,
        text: item.sharedPost.text,
        images: toImages(item.sharedPost.media),
      },
      engagement: item.engagement,
    };
  }
}
