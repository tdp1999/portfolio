export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'],
  documents: [
    'application/pdf',
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
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024,
  'text/markdown': 10 * 1024 * 1024,
  'text/plain': 10 * 1024 * 1024,
  'video/mp4': 50 * 1024 * 1024,
  'video/webm': 50 * 1024 * 1024,
  'application/zip': 20 * 1024 * 1024,
};

export const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const UPLOAD_FOLDERS = ['avatars', 'projects', 'posts', 'logos', 'resumes', 'general'] as const;
