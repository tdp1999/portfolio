import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthStore, ThemeService, UnreadBadgeService, VersionService } from '@portfolio/console/shared/data-access';
import { MainLayout, ToastService } from '@portfolio/console/shared/ui';

@Component({
  selector: 'console-layout-shell',
  standalone: true,
  imports: [MainLayout],
  template: `
    <console-main-layout
      [user]="authStore.user()"
      [resolvedTheme]="themeService.resolvedTheme()"
      [unreadCount]="unreadBadge.count()"
      [versionLabel]="versionLabel()"
      (logout)="onLogout()"
      (logoutAll)="onLogoutAll()"
      (themeToggle)="themeService.toggle()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutShell {
  protected readonly authStore = inject(AuthStore);
  protected readonly themeService = inject(ThemeService);
  protected readonly unreadBadge = inject(UnreadBadgeService);
  private readonly versionService = inject(VersionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private readonly version = toSignal(this.versionService.getVersion(), { initialValue: null });
  protected readonly versionLabel = computed(() => {
    const v = this.version();
    return v ? `${v.commitShaShort} · ${v.environment}` : 'local';
  });

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
