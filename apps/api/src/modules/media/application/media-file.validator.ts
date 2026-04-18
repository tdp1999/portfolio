import { BadRequestError, ErrorLayer, MediaErrorCode } from '@portfolio/shared/errors';
import { ISecurityScanner, ScanResult } from './ports/security-scanner.port';
import { ALL_ALLOWED_MIME_TYPES, MAX_FILE_SIZES, DEFAULT_MAX_FILE_SIZE } from './media.constants';

export interface FileValidationResult {
  sanitizedBuffer: Buffer;
  detectedMimeType: string;
  sanitizedFilename: string;
}

export function validateFileSize(buffer: Buffer, mimeType: string): void {
  const maxSize = MAX_FILE_SIZES[mimeType] ?? DEFAULT_MAX_FILE_SIZE;
  if (buffer.length > maxSize)
    throw BadRequestError(`File size ${buffer.length} exceeds limit of ${maxSize} bytes for ${mimeType}`, {
      errorCode: MediaErrorCode.FILE_TOO_LARGE,
      layer: ErrorLayer.APPLICATION,
    });
}

export function validateMimeType(mimeType: string): void {
  if (!ALL_ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALL_ALLOWED_MIME_TYPES)[number]))
    throw BadRequestError(`MIME type ${mimeType} is not supported`, {
      errorCode: MediaErrorCode.UNSUPPORTED_TYPE,
      layer: ErrorLayer.APPLICATION,
    });
}

export async function validateSecurity(
  scanner: ISecurityScanner,
  buffer: Buffer,
  mimeType: string
): Promise<ScanResult> {
  const result = await scanner.validate(buffer, mimeType);
  if (!result.safe)
    throw BadRequestError(`Security threat detected: ${result.threats.join(', ')}`, {
      errorCode: MediaErrorCode.SECURITY_THREAT,
      layer: ErrorLayer.APPLICATION,
    });
  return result;
}

export function resolveResourceType(mimeType: string): 'image' | 'video' | 'raw' {
  if (mimeType.startsWith('image/') || mimeType === 'application/pdf') return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
}
