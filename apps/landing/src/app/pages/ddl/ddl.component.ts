import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
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
  ContainerComponent,
  SectionComponent,
  LandingThemeService,
  LandingThemeToggleComponent,
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
    ContainerComponent,
    SectionComponent,
    LandingThemeToggleComponent,
  ],
  templateUrl: './ddl.component.html',
  styleUrl: './ddl.component.scss',
})
export class DdlComponent {
  private readonly themeService = inject(LandingThemeService);
  private readonly iconProvider = inject(ICON_PROVIDER);

  readonly iconNames = this.iconProvider.getSupportedIcons();
  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  toggleDark(): void {
    this.themeService.toggle();
  }
}
