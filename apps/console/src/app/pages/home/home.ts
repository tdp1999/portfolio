import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@portfolio/console/shared/data-access';

interface DashboardStat {
  label: string;
  value: number;
  icon: string;
}

interface ActivityItem {
  icon: string;
  description: string;
  timestamp: string;
}

@Component({
  selector: 'console-home',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto">
      <h1 class="text-page-title">Welcome back, {{ userName() }}</h1>
      <p class="mt-2 text-page-subtitle">Here's what's happening with your portfolio today.</p>

      <div class="mt-8 mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (stat of stats; track stat.label) {
          <div class="stat-card flex items-center gap-4 rounded-xl border p-6">
            <div class="stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <mat-icon class="icon-md">{{ stat.icon }}</mat-icon>
            </div>
            <div>
              <p class="text-stat-label mb-1">{{ stat.label }}</p>
              <p class="text-stat-value">{{ stat.value }}</p>
            </div>
          </div>
        }
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-section-heading flex items-center gap-2">
              <mat-icon class="icon-md text-primary">history</mat-icon>
              Recent Activity
            </h2>
            <button class="text-xs text-primary cursor-pointer hover:underline bg-transparent border-none">
              View All
            </button>
          </div>
          <div class="activity-container rounded-xl overflow-hidden">
            @for (activity of activities; track activity.description) {
              <div class="activity-item flex items-center gap-4 px-6 py-4">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <mat-icon class="icon-sm text-primary">{{ activity.icon }}</mat-icon>
                </div>
                <div class="flex-1">
                  <p class="text-body">{{ activity.description }}</p>
                  <p class="text-caption">{{ activity.timestamp }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <div>
          <h2 class="text-section-heading px-2 mb-4">Quick Actions</h2>
          <div class="flex flex-col gap-4">
            <button mat-flat-button color="primary" class="w-full">
              <mat-icon class="icon-md">add_circle</mat-icon>
              New Content
            </button>
            <button mat-stroked-button routerLink="/media" class="w-full">
              <mat-icon class="icon-md">cloud_upload</mat-icon>
              Media Library
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .stat-card {
      background: var(--color-surface-elevated);
      border-color: var(--color-border);
      transition: background 0.2s ease;
    }
    .stat-card:hover {
      background: rgba(99, 102, 241, 0.05);
    }
    .stat-icon {
      background: rgba(99, 102, 241, 0.1);
      color: rgb(99, 102, 241);
    }
    .activity-container {
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
    }
    .activity-item + .activity-item {
      border-top: 1px solid var(--color-border);
    }
    .activity-item:hover {
      background: var(--color-surface-hover);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {
  private readonly authStore = inject(AuthStore);

  readonly userName = computed(() => this.authStore.user()?.name?.split(' ')[0] ?? 'User');

  readonly stats: DashboardStat[] = [
    { label: 'Total Posts', value: 24, icon: 'article' },
    { label: 'Media Files', value: 156, icon: 'perm_media' },
    { label: 'Published', value: 18, icon: 'check_circle' },
    { label: 'Drafts', value: 6, icon: 'edit_note' },
  ];

  readonly activities: ActivityItem[] = [
    { icon: 'publish', description: "Published 'Getting Started with NestJS'", timestamp: '2 hours ago' },
    { icon: 'upload_file', description: 'Uploaded 3 new media files', timestamp: '5 hours ago' },
    { icon: 'edit', description: "Updated 'Angular Signals Deep Dive' draft", timestamp: 'Yesterday' },
  ];
}
