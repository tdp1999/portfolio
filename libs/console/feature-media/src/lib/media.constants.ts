/** Client-side validation constants — mirrored from API media.constants */

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
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
};

export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES['images'],
  ...ALLOWED_MIME_TYPES['documents'],
  ...ALLOWED_MIME_TYPES['video'],
  ...ALLOWED_MIME_TYPES['archives'],
];

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

export const MAX_BULK_UPLOAD_FILES = 10;

export const MIME_TYPE_FILTERS = [
  { value: '', label: 'All types' },
  { value: 'image/', label: 'Images' },
  { value: 'application/pdf', label: 'Documents' },
  { value: 'video/', label: 'Video' },
  { value: 'application/zip', label: 'Archives' },
];

export function validateFile(file: File): string | null {
  if (!ALL_ALLOWED_MIME_TYPES.includes(file.type)) {
    return `File type "${file.type || 'unknown'}" is not allowed`;
  }
  const maxSize = MAX_FILE_SIZES[file.type] ?? DEFAULT_MAX_FILE_SIZE;
  if (file.size > maxSize) {
    return `File exceeds max size of ${formatFileSize(maxSize)}`;
  }
  return null;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getMimeTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType === 'application/zip') return 'Archive';
  if (mimeType.startsWith('text/')) return 'Text';
  if (mimeType.includes('document') || mimeType.includes('sheet')) return 'Document';
  return 'File';
}
