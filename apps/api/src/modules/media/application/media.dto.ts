import { z } from 'zod/v4';
import { stripHtmlTags, nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';
import { UPLOAD_FOLDERS } from './media.constants';

const AltTextSchema = z
  .string()
  .min(1)
  .max(500)
  .transform((v) => stripHtmlTags(v.trim()));

const CaptionSchema = z
  .string()
  .min(1)
  .max(1000)
  .transform((v) => stripHtmlTags(v.trim()));

export const CreateMediaSchema = z.object({
  altText: AltTextSchema.optional(),
  caption: CaptionSchema.optional(),
  folder: z.enum(UPLOAD_FOLDERS).default('general'),
});

const UpdateMediaMetadataFieldsSchema = z.object({
  altText: AltTextSchema.nullable(),
  caption: CaptionSchema.nullable(),
});

export const UpdateMediaMetadataSchema = nonEmptyPartial(UpdateMediaMetadataFieldsSchema);

export const ListMediaSchema = PaginatedQuerySchema.extend({
  mimeTypePrefix: z.string().optional(),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(50),
});

export type CreateMediaDto = z.infer<typeof CreateMediaSchema>;
export type UpdateMediaMetadataDto = z.infer<typeof UpdateMediaMetadataSchema>;
export type ListMediaDto = z.infer<typeof ListMediaSchema>;
export type BulkDeleteDto = z.infer<typeof BulkDeleteSchema>;

export type MediaResponseDto = {
  id: string;
  originalFilename: string;
  mimeType: string;
  url: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  createdAt: Date;
  updatedAt: Date;
};
