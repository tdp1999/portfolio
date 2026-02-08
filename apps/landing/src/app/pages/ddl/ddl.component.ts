import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ddl',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ddl.component.html',
  styleUrl: './ddl.component.scss',
})
export class DdlComponent {
  isDark = signal(false);

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  toggleDark() {
    this.isDark.update(v => !v);
  }
}
