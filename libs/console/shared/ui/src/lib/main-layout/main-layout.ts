import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
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
export class ConsoleMainLayoutComponent {}
