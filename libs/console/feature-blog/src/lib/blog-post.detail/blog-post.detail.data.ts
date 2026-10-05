import type { BlogStatus } from '../blog.types';

/** `console-badge` modifier of each status in the post header. */
export const STATUS_BADGE_MODIFIERS: Record<BlogStatus, string> = {
  PUBLISHED: 'console-badge--success',
  DRAFT: 'console-badge--warn',
  PRIVATE: 'console-badge--muted',
  UNLISTED: 'console-badge--muted',
};
