export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/markdown',
    'text/plain',
  ],
  video: ['video/mp4', 'video/webm'],
  archives: ['application/zip'],
} as const;

export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.video,
  ...ALLOWED_MIME_TYPES.archives,
] as const;

/** Max file sizes in bytes */
export const MAX_FILE_SIZES: Record<string, number> = {
  'image/jpeg': 5 * 1024 * 1024,
  'image/png': 5 * 1024 * 1024,
  'image/gif': 5 * 1024 * 1024,
  'image/webp': 5 * 1024 * 1024,
  'image/svg+xml': 5 * 1024 * 1024,
  'image/avif': 5 * 1024 * 1024,
  'application/pdf': 10 * 1024 * 1024,
  'application/msword': 10 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024,
  'text/markdown': 10 * 1024 * 1024,
  'text/plain': 10 * 1024 * 1024,
  'video/mp4': 50 * 1024 * 1024,
  'video/webm': 50 * 1024 * 1024,
  'application/zip': 20 * 1024 * 1024,
};

export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const UPLOAD_FOLDERS = ['avatars', 'projects', 'posts', 'logos', 'resumes', 'skills', 'general'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const MEDIA_MIME_GROUPS = ['image', 'video', 'pdf', 'doc', 'archive'] as const;
export type MediaMimeGroup = (typeof MEDIA_MIME_GROUPS)[number];

export const MIME_GROUP_SETS: Record<MediaMimeGroup, readonly string[]> = {
  image: ALLOWED_MIME_TYPES.images,
  video: ALLOWED_MIME_TYPES.video,
  pdf: ['application/pdf'],
  doc: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
  ],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ],
} as const;

/**
 * The one extension each allowed MIME type may be stored under.
 *
 * Storage adapters must name files from the **scanner-validated** MIME type, never from the
 * uploaded filename. `detectMimeType` returns `text/plain` and `text/markdown` unverified because
 * neither has magic bytes, so a file called `x.html` declared as `text/plain` passes the scanner
 * with its extension intact — and an adapter that trusts the filename would then serve it as
 * `text/html` from the API's own origin. Mapping through this table makes that impossible.
 */
export const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/markdown': 'md',
  'text/plain': 'txt',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/zip': 'zip',
};

/** Defense-in-depth limit at multer/interceptor level (50MB). Per-type limits enforced in handlers. */
export const MULTER_LIMITS = { fileSize: 50 * 1024 * 1024 } as const;

export const MAX_BULK_UPLOAD_FILES = 10;
