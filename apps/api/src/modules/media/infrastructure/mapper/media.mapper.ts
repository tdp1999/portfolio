import { Media as PrismaMedia } from '@prisma/client';
import { Media } from '../../domain/entities/media.entity';
import { IMediaProps } from '../../domain/media.types';

export class MediaMapper {
  static toDomain(raw: PrismaMedia): Media {
    const props: IMediaProps = {
      id: raw.id,
      originalFilename: raw.originalFilename,
      mimeType: raw.mimeType,
      publicId: raw.publicId,
      url: raw.url,
      format: raw.format,
      bytes: raw.bytes,
      width: raw.width,
      height: raw.height,
      altText: raw.altText,
      caption: raw.caption,
      folder: raw.folder,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
      deletedAt: raw.deletedAt,
      deletedById: raw.deletedById,
    };
    return Media.load(props);
  }

  static toPrisma(media: Media): Omit<PrismaMedia, 'createdAt' | 'updatedAt'> {
    return {
      id: media.id,
      originalFilename: media.originalFilename,
      mimeType: media.mimeType,
      publicId: media.publicId,
      url: media.url,
      format: media.format,
      bytes: media.bytes,
      width: media.width,
      height: media.height,
      altText: media.altText,
      caption: media.caption,
      folder: media.folder,
      createdById: media.createdById,
      updatedById: media.updatedById,
      deletedAt: media.deletedAt,
      deletedById: media.deletedById,
    };
  }
}
