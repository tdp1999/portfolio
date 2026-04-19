import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { UserProfile } from '@portfolio/console/shared/util';
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
  readonly user = input.required<UserProfile | null>();
  readonly resolvedTheme = input.required<'light' | 'dark'>();
  readonly unreadCount = input<number>(0);

  readonly logout = output<void>();
  readonly logoutAll = output<void>();
  readonly themeToggle = output<void>();

  readonly userInitial = computed(() => this.user()?.name?.charAt(0).toUpperCase() ?? '?');
  readonly hasPassword = computed(() => this.user()?.hasPassword ?? true);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');
  readonly themeIcon = computed(() => (this.resolvedTheme() === 'dark' ? 'light_mode' : 'dark_mode'));
  readonly themeTooltip = computed(() =>
    this.resolvedTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  );
  readonly unreadBadgeText = computed(() => {
    const count = this.unreadCount();
    if (count === 0) return '';
    return count > 99 ? '99+' : String(count);
  });
}
