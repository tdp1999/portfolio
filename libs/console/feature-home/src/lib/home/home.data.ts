import type { ActivityItem, DashboardStat } from './home.types';

export const STATS: DashboardStat[] = [
  { label: 'Total Posts', value: 24, icon: 'article' },
  { label: 'Media Files', value: 156, icon: 'perm_media' },
  { label: 'Published', value: 18, icon: 'check_circle' },
  { label: 'Drafts', value: 6, icon: 'edit_note' },
];

export const ACTIVITIES: ActivityItem[] = [
  { icon: 'publish', description: "Published 'Getting Started with NestJS'", timestamp: '2 hours ago' },
  { icon: 'upload_file', description: 'Uploaded 3 new media files', timestamp: '5 hours ago' },
  { icon: 'edit', description: "Updated 'Angular Signals Deep Dive' draft", timestamp: 'Yesterday' },
];
