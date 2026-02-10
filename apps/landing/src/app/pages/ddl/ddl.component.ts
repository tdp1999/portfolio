import { CommonModule } from '@angular/common';
import { Component, DOCUMENT, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ICON_PROVIDER,
  IconComponent,
  ButtonComponent,
  CardComponent,
  InputComponent,
  BadgeComponent,
  LinkDirective,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'app-ddl',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    IconComponent,
    ButtonComponent,
    CardComponent,
    InputComponent,
    BadgeComponent,
    LinkDirective,
  ],
  templateUrl: './ddl.component.html',
  styleUrl: './ddl.component.scss',
})
export class DdlComponent {
  isDark = signal(false);
  private readonly document = inject(DOCUMENT);
  private readonly iconProvider = inject(ICON_PROVIDER);

  readonly iconNames = this.iconProvider.getSupportedIcons();

  constructor() {
    effect(() => {
      this.document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  toggleDark() {
    this.isDark.update((v) => !v);
  }
}
