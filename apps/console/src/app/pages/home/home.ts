import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'console-home',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <h1 class="text-2xl font-semibold text-text">Dashboard</h1>
    <p class="mt-2 text-text-secondary">Welcome to the Console.</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {}
