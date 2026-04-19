import { IBaseAuditProps } from '@portfolio/shared/types';

export interface IMediaProps extends IBaseAuditProps {
  originalFilename: string;
  mimeType: string;
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  folder: string | null;
}

export interface ICreateMediaPayload {
  originalFilename: string;
  mimeType: string;
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  altText?: string;
  caption?: string;
  folder?: string | null;
}

export interface IUpdateMediaMetadataPayload {
  altText?: string | null;
  caption?: string | null;
}
