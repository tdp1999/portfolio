import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthStore } from '@portfolio/console/shared/data-access';
import { ToastService } from '../toast/toast.service';
import { SidebarModule } from '@portfolio/shared/ui/sidebar';

@Component({
  selector: 'console-main-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet, SidebarModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-dvh' },
})
export class ConsoleMainLayoutComponent {
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly user = this.authStore.user;
  readonly userInitial = computed(() => this.user()?.name?.charAt(0).toUpperCase() ?? '?');
  readonly userMenuOpen = signal(false);

  toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.authStore.logout().subscribe(() => {
      this.toast.success('Logged out successfully');
      this.router.navigateByUrl('/auth/login');
    });
  }

  logoutAll(): void {
    this.closeUserMenu();
    this.authStore.logoutAll().subscribe(() => {
      this.toast.success('Logged out from all devices');
      this.router.navigateByUrl('/auth/login');
    });
  }
}
