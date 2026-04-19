import { BaseCrudEntity } from '@portfolio/shared/types';
import { BadRequestError, ConflictError } from '@portfolio/shared/errors';
import { MediaErrorCode } from '@portfolio/shared/errors';
import { IMediaProps, ICreateMediaPayload, IUpdateMediaMetadataPayload } from '../media.types';

export class Media extends BaseCrudEntity<IMediaProps> {
  private constructor(props: IMediaProps) {
    super(props);
  }

  get originalFilename(): string {
    return this.props.originalFilename;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get publicId(): string {
    return this.props.publicId;
  }

  get url(): string {
    return this.props.url;
  }

  get format(): string {
    return this.props.format;
  }

  get bytes(): number {
    return this.props.bytes;
  }

  get width(): number | null {
    return this.props.width;
  }

  get height(): number | null {
    return this.props.height;
  }

  get altText(): string | null {
    return this.props.altText;
  }

  get caption(): string | null {
    return this.props.caption;
  }

  get folder(): string | null {
    return this.props.folder;
  }

  static create(data: ICreateMediaPayload, userId: string): Media {
    return new Media({
      ...BaseCrudEntity.createBaseProps(userId),
      originalFilename: data.originalFilename,
      mimeType: data.mimeType,
      publicId: data.publicId,
      url: data.url,
      format: data.format,
      bytes: data.bytes,
      width: data.width ?? null,
      height: data.height ?? null,
      altText: data.altText ?? null,
      caption: data.caption ?? null,
      folder: data.folder ?? null,
    });
  }

  static load(props: IMediaProps): Media {
    return new Media(props);
  }

  updateMetadata(data: IUpdateMediaMetadataPayload, userId: string): Media {
    return new Media({
      ...this.props,
      altText: data.altText !== undefined ? (data.altText ?? null) : this.props.altText,
      caption: data.caption !== undefined ? (data.caption ?? null) : this.props.caption,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): Media {
    if (this.isDeleted) {
      throw ConflictError('Media is already deleted', {
        errorCode: MediaErrorCode.ALREADY_DELETED,
      });
    }

    return new Media({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  restore(userId: string): Media {
    if (!this.isDeleted) {
      throw BadRequestError('Media is not deleted', {
        errorCode: MediaErrorCode.NOT_DELETED,
      });
    }

    return new Media({
      ...this.props,
      deletedAt: null,
      deletedById: null,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): IMediaProps {
    return { ...this.props };
  }
}
