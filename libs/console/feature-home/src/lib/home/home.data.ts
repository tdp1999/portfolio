import type { ActivityItem } from './home.types';

// NOTE(task-194 descope): activity feed is intentionally still mock data.
// Stats are now real (`GET /api/dashboard/stats`); a derived recent-activity
// query was deferred. Search + notifications were cut from scope.
export const ACTIVITIES: ActivityItem[] = [
  { icon: 'publish', description: "Published 'Getting Started with NestJS'", timestamp: '2 hours ago' },
  { icon: 'upload_file', description: 'Uploaded 3 new media files', timestamp: '5 hours ago' },
  { icon: 'edit', description: "Updated 'Angular Signals Deep Dive' draft", timestamp: 'Yesterday' },
];
