import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore, ThemeService, UnreadBadgeService } from '@portfolio/console/shared/data-access';
import { ConsoleMainLayoutComponent, ToastService } from '@portfolio/console/shared/ui';

@Component({
  selector: 'console-layout-shell',
  standalone: true,
  imports: [ConsoleMainLayoutComponent],
  template: `
    <console-main-layout
      [user]="authStore.user()"
      [resolvedTheme]="themeService.resolvedTheme()"
      [unreadCount]="unreadBadge.count()"
      (logout)="onLogout()"
      (logoutAll)="onLogoutAll()"
      (themeToggle)="themeService.toggle()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutShellComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly themeService = inject(ThemeService);
  protected readonly unreadBadge = inject(UnreadBadgeService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  constructor() {
    if (this.authStore.user()?.role === 'ADMIN') {
      this.unreadBadge.refresh();
    }
  }

  onLogout(): void {
    this.authStore.logout().subscribe(() => {
      this.toast.success('Logged out successfully');
      this.router.navigateByUrl('/auth/login');
    });
  }

  onLogoutAll(): void {
    this.authStore.logoutAll().subscribe(() => {
      this.toast.success('Logged out from all devices');
      this.router.navigateByUrl('/auth/login');
    });
  }
}
