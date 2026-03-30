import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthStore, ThemeService, UnreadBadgeService } from '@portfolio/console/shared/data-access';
import { ToastService } from '../toast/toast.service';
import { SidebarModule } from '@portfolio/shared/ui/sidebar';

@Component({
  selector: 'console-main-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SidebarModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-dvh' },
})
export class ConsoleMainLayoutComponent {
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);
  protected readonly unreadBadge = inject(UnreadBadgeService);

  readonly user = this.authStore.user;
  readonly userInitial = computed(() => this.user()?.name?.charAt(0).toUpperCase() ?? '?');
  readonly hasPassword = computed(() => this.user()?.hasPassword ?? true);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');
  readonly themeIcon = computed(() => (this.themeService.resolvedTheme() === 'dark' ? 'light_mode' : 'dark_mode'));
  readonly themeTooltip = computed(() =>
    this.themeService.resolvedTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
  readonly unreadCount = this.unreadBadge.count;
  readonly unreadBadgeText = computed(() => {
    const count = this.unreadCount();
    if (count === 0) return '';
    return count > 99 ? '99+' : String(count);
  });

  constructor() {
    // Refresh unread count on init (admin only)
    if (this.isAdmin()) {
      this.unreadBadge.refresh();
    }
  }

  logout(): void {
    this.authStore.logout().subscribe(() => {
      this.toast.success('Logged out successfully');
      this.router.navigateByUrl('/auth/login');
    });
  }

  logoutAll(): void {
    this.authStore.logoutAll().subscribe(() => {
      this.toast.success('Logged out from all devices');
      this.router.navigateByUrl('/auth/login');
    });
  }
}
