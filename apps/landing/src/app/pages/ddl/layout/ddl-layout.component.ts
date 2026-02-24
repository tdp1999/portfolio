import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarModule } from '@portfolio/shared/ui/sidebar';

@Component({
  selector: 'app-ddl-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SidebarModule],
  host: { class: 'block h-dvh' },
  template: `
    <ui-sidebar-provider class="h-dvh bg-background">
      <ui-sidebar data-testid="sidebar">
        <!-- Header: Workspace selector -->
        <ui-sidebar-header>
          <div class="flex items-center gap-2 px-1" data-testid="sidebar-header">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-text-on-primary text-sm font-bold"
            >
              A
            </div>
            <div class="flex min-w-0 flex-col">
              <span class="truncate text-sm font-semibold text-text">Acme Corp</span>
              <span class="truncate text-xs text-text-muted">Enterprise Plan</span>
            </div>
            <svg
              class="ml-auto h-4 w-4 shrink-0 text-text-muted"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </ui-sidebar-header>

        <ui-sidebar-content>
          <!-- Platform group -->
          <ui-sidebar-group label="Platform" data-testid="platform-group">
            <ul uiSidebarMenu>
              <li uiSidebarMenuItem>
                <a
                  ui-sidebar-menu-button
                  routerLink="/ddl/layout"
                  routerLinkActive="font-semibold"
                  data-testid="menu-dashboard"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="2" y="2" width="5" height="5" rx="1" />
                    <rect x="9" y="2" width="5" height="5" rx="1" />
                    <rect x="2" y="9" width="5" height="5" rx="1" />
                    <rect x="9" y="9" width="5" height="5" rx="1" />
                  </svg>
                  <span>Dashboard</span>
                </a>
              </li>

              <li uiSidebarMenuItem>
                <button
                  ui-sidebar-menu-button
                  (click)="projectsSub.toggle()"
                  data-testid="menu-projects"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M2 4h12M2 8h12M2 12h12" />
                  </svg>
                  <span>Projects</span>
                  <span uiSidebarMenuBadge class="bg-primary text-text-on-primary ml-auto">12</span>
                </button>
                <ui-sidebar-menu-sub #projectsSub data-testid="projects-submenu">
                  <li uiSidebarMenuSubItem>
                    <button ui-sidebar-menu-sub-button>Website Redesign</button>
                  </li>
                  <li uiSidebarMenuSubItem>
                    <button ui-sidebar-menu-sub-button>Mobile App v2</button>
                  </li>
                  <li uiSidebarMenuSubItem>
                    <button ui-sidebar-menu-sub-button>API Migration</button>
                  </li>
                  <li uiSidebarMenuSubItem>
                    <button ui-sidebar-menu-sub-button>Design System</button>
                  </li>
                </ui-sidebar-menu-sub>
              </li>

              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button data-testid="menu-inbox">
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M2 4l6 4 6-4" />
                    <rect x="2" y="3" width="12" height="10" rx="1" />
                  </svg>
                  <span>Inbox</span>
                  <span uiSidebarMenuBadge class="bg-primary text-text-on-primary ml-auto">5</span>
                </button>
              </li>

              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="2" y="2" width="12" height="12" rx="1" />
                    <path d="M2 6h12M6 2v12" />
                  </svg>
                  <span>Calendar</span>
                </button>
              </li>

              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="8" cy="8" r="1" />
                    <path d="M3 8h4M9 8h4M8 3v4M8 9v4" />
                  </svg>
                  <span>Tasks</span>
                </button>
              </li>

              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M2 12l4-6 3 4 2-2 3 4" />
                    <rect x="2" y="2" width="12" height="12" rx="1" />
                  </svg>
                  <span>Analytics</span>
                </button>
              </li>

              <li uiSidebarMenuItem>
                <button
                  ui-sidebar-menu-button
                  (click)="reportsSub.toggle()"
                  data-testid="menu-reports"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 2v12M8 6v8M12 4v10" />
                  </svg>
                  <span>Reports</span>
                </button>
                <ui-sidebar-menu-sub #reportsSub data-testid="reports-submenu">
                  <li uiSidebarMenuSubItem>
                    <button ui-sidebar-menu-sub-button>Monthly Overview</button>
                  </li>
                  <li uiSidebarMenuSubItem>
                    <button ui-sidebar-menu-sub-button>
                      Quarterly Performance and Revenue Analysis Report
                    </button>
                  </li>
                  <li uiSidebarMenuSubItem>
                    <button ui-sidebar-menu-sub-button>Annual Summary</button>
                  </li>
                </ui-sidebar-menu-sub>
              </li>

              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 2h10v12H3zM5 5h6M5 8h6M5 11h3" />
                  </svg>
                  <span>Documentation</span>
                </button>
              </li>
            </ul>
          </ui-sidebar-group>

          <div uiSidebarSeparator></div>

          <!-- Resources collapsible group -->
          <ui-sidebar-group label="Resources" [collapsible]="true" data-testid="resources-group">
            <ul uiSidebarMenu>
              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="8" cy="8" r="6" />
                    <path d="M6 6.5a2 2 0 013 1.5c0 1-1.5 1-1.5 2.5M8 12.5v0" />
                  </svg>
                  <span>Help Center</span>
                </button>
              </li>
              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 4h8M4 8h5M4 12h8" />
                    <path d="M12 7l2 2-2 2" />
                  </svg>
                  <span>API Reference</span>
                </button>
              </li>
              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M8 2v12M5 5l-3 3 3 3M11 5l3 3-3 3" />
                  </svg>
                  <span>Changelog</span>
                </button>
              </li>
              <li uiSidebarMenuItem>
                <button ui-sidebar-menu-button>
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2 14c0-3 3-5 6-5s6 2 6 5" />
                  </svg>
                  <span>Community Forum</span>
                </button>
              </li>
            </ul>
          </ui-sidebar-group>

          <div uiSidebarSeparator></div>

          <!-- Team group -->
          <ui-sidebar-group label="Team" data-testid="team-group">
            <ul uiSidebarMenu>
              @for (member of teamMembers; track member.name) {
                <li uiSidebarMenuItem>
                  <button ui-sidebar-menu-button>
                    <span
                      class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                      [style.background-color]="member.color"
                    >
                      {{ member.initials }}
                    </span>
                    <span>{{ member.name }}</span>
                    <span
                      class="ml-auto h-2 w-2 shrink-0 rounded-full"
                      [class]="member.online ? 'bg-green-500' : 'bg-zinc-400'"
                    ></span>
                  </button>
                </li>
              }
            </ul>
          </ui-sidebar-group>
        </ui-sidebar-content>

        <!-- Footer: User profile -->
        <ui-sidebar-footer>
          <div class="flex items-center gap-2 px-1" data-testid="sidebar-footer">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold"
            >
              JD
            </div>
            <div class="flex min-w-0 flex-col">
              <span class="truncate text-sm font-medium text-text">John Doe</span>
              <span class="truncate text-xs text-text-muted">john&#64;acme.com</span>
            </div>
            <svg
              class="ml-auto h-4 w-4 shrink-0 text-text-muted"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 10l4-4 4 4" />
            </svg>
          </div>
        </ui-sidebar-footer>

        <ui-sidebar-rail />
      </ui-sidebar>

      <ui-sidebar-inset>
        <div class="flex items-center gap-2 border-b border-border px-4 py-2">
          <ui-sidebar-trigger data-testid="inset-trigger" />
          <h2 class="text-lg font-semibold text-text">Sidebar Layout Demo</h2>
          <button
            class="ml-auto px-3 py-1 rounded border border-border text-sm text-text-secondary hover:text-text"
            (click)="toggleDark()"
            data-testid="dark-toggle"
          >
            {{ isDark() ? 'Light' : 'Dark' }}
          </button>
        </div>
        <div class="p-6">
          <p class="text-text-secondary" data-testid="main-content">
            This demo stress-tests the sidebar library with a realistic app layout: workspace
            selector, multiple menu groups, submenus with badges, collapsible groups, team members
            with status indicators, and a user profile footer. Try toggling via the trigger button,
            the rail, or resize to mobile.
          </p>
        </div>
      </ui-sidebar-inset>
    </ui-sidebar-provider>
  `,
})
export class DdlLayoutComponent {
  isDark = signal(false);
  private readonly document = inject(DOCUMENT);

  readonly teamMembers = [
    { name: 'Alice Chen', initials: 'AC', color: '#6366f1', online: true },
    { name: 'Bob Martinez', initials: 'BM', color: '#ec4899', online: true },
    { name: 'Carol Smith', initials: 'CS', color: '#f59e0b', online: false },
    { name: 'Dave Wilson', initials: 'DW', color: '#10b981', online: true },
    { name: 'Eve Johnson', initials: 'EJ', color: '#8b5cf6', online: false },
    { name: 'Frank Lee', initials: 'FL', color: '#ef4444', online: true },
  ];

  toggleDark(): void {
    this.isDark.update((v) => !v);
    this.document.documentElement.classList.toggle('dark', this.isDark());
  }
}
