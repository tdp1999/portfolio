export const MIME_GROUPS = ['image', 'video', 'pdf', 'doc', 'archive'] as const;
export type MimeGroup = (typeof MIME_GROUPS)[number];

export const SORT_OPTIONS = ['createdAt_desc', 'createdAt_asc', 'filename_asc', 'bytes_desc'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const DEFAULT_SORT: SortOption = 'createdAt_desc';

export const UPLOAD_FOLDERS = ['avatars', 'projects', 'posts', 'logos', 'resumes', 'skills', 'general'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const MIME_GROUP_LABELS: Record<MimeGroup, string> = {
  image: 'Images',
  video: 'Video',
  pdf: 'PDF',
  doc: 'Docs',
  archive: 'Archives',
};

export const SORT_LABELS: Record<SortOption, string> = {
  createdAt_desc: 'Newest',
  createdAt_asc: 'Oldest',
  filename_asc: 'Name A→Z',
  bytes_desc: 'Size desc',
};

export const UPLOAD_FOLDER_LABELS: Record<UploadFolder, string> = {
  avatars: 'Avatars',
  projects: 'Projects',
  posts: 'Posts',
  logos: 'Logos',
  resumes: 'Resumes',
  skills: 'Skills',
  general: 'General',
};
