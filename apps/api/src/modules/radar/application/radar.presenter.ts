import { RadarSourceWithCount } from './ports/radar-source.repository.port';
import { RadarSourceResponseDto } from './radar.dto';

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
}
