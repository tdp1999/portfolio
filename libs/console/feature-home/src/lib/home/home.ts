import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthStore, DashboardService, type DashboardStats } from '@portfolio/console/shared/data-access';
import { ACTIVITIES } from './home.data';
import type { ActivityItem, DashboardStat } from './home.types';

@Component({
  selector: 'console-home',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto">
      <h1 class="text-page-title">Welcome back, {{ userName() }}</h1>
      <p class="mt-2 text-page-subtitle">Here's what's happening with your portfolio today.</p>

      <div class="mt-8 mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (stat of stats(); track stat.label) {
          <a
            [routerLink]="stat.link"
            [queryParams]="stat.queryParams"
            class="stat-card flex items-center gap-4 rounded-xl border p-6 no-underline text-inherit"
          >
            <div class="stat-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <mat-icon class="icon-md">{{ stat.icon }}</mat-icon>
            </div>
            <div>
              <p class="text-stat-label mb-1">{{ stat.label }}</p>
              <p class="text-stat-value">{{ stat.value }}</p>
            </div>
          </a>
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
      transition: all 0.15s ease;
    }
    .stat-card:hover {
      background: var(--color-primary-container);
    }
    .stat-icon {
      background: var(--color-primary-container);
      color: var(--color-primary);
    }
    .activity-container {
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);
    }
    .activity-item + .activity-item {
      border-top: 1px solid var(--color-border);
    }
    .activity-item {
      transition: background 0.15s ease;
    }
    .activity-item:hover {
      background: var(--color-surface-hover);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly authStore = inject(AuthStore);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  // ── State ─────────────────────────────────────────────────────────
  private readonly statValues = signal<DashboardStats | null>(null);

  // ── Derived ───────────────────────────────────────────────────────
  readonly userName = computed(() => this.authStore.user()?.name?.split(' ')[0] ?? 'User');

  // Labels + icons are presentation; values come from the API (0 until loaded).
  readonly stats = computed<DashboardStat[]>(() => {
    const s = this.statValues();
    return [
      { label: 'Total Posts', value: s?.totalPosts ?? 0, icon: 'article', link: '/admin/blog' },
      { label: 'Media Files', value: s?.mediaFiles ?? 0, icon: 'perm_media', link: '/media' },
      {
        label: 'Published',
        value: s?.published ?? 0,
        icon: 'check_circle',
        link: '/admin/blog',
        queryParams: { status: 'PUBLISHED' },
      },
      {
        label: 'Drafts',
        value: s?.drafts ?? 0,
        icon: 'edit_note',
        link: '/admin/blog',
        queryParams: { status: 'DRAFT' },
      },
    ];
  });

  // TODO(task-194 descope): activity feed still mocked — revisit with a derived
  // recent-activity query once higher-priority features land.
  readonly activities: ActivityItem[] = ACTIVITIES;

  constructor() {
    this.dashboardService
      .getStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => this.statValues.set(stats),
        error: () => {
          // Stat cards stay at 0 — dashboard is non-critical, no toast.
        },
      });
  }
}
