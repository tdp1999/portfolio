import { Media } from '../domain/entities/media.entity';
import { MediaResponseDto } from './media.dto';

export class MediaPresenter {
  static toResponse(media: Media): MediaResponseDto {
    return {
      id: media.id,
      originalFilename: media.originalFilename,
      mimeType: media.mimeType,
      url: media.url,
      format: media.format,
      bytes: media.bytes,
      width: media.width,
      height: media.height,
      altText: media.altText,
      caption: media.caption,
      folder: media.folder,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
