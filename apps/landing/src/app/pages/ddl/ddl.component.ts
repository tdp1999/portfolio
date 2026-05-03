import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  LandingLinkComponent,
  LandingIconArrowComponent,
  ContainerComponent,
  SectionComponent,
  ChipComponent,
  EyebrowComponent,
  StatusDotComponent,
  FigureComponent,
  PullQuoteComponent,
  SectionRuleComponent,
  SegmentedComponent,
  SegmentOption,
  LandingThemeService,
  LandingThemeToggleComponent,
} from '@portfolio/landing/shared/ui';

const TABS_WITH_PROTOTYPES: readonly SegmentOption[] = [
  { id: 'showcase', label: 'Showcase' },
  { id: 'prototypes', label: 'Prototypes' },
  { id: 'usage', label: 'Usage' },
];

const TABS_NO_PROTOTYPES: readonly SegmentOption[] = [
  { id: 'showcase', label: 'Showcase' },
  { id: 'usage', label: 'Usage' },
];

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
    LandingLinkComponent,
    LandingIconArrowComponent,
    ContainerComponent,
    SectionComponent,
    ChipComponent,
    EyebrowComponent,
    StatusDotComponent,
    FigureComponent,
    PullQuoteComponent,
    SectionRuleComponent,
    SegmentedComponent,
    LandingThemeToggleComponent,
  ],
  templateUrl: './ddl.component.html',
  styleUrl: './ddl.component.scss',
})
export class DdlComponent {
  private readonly themeService = inject(LandingThemeService);
  private readonly iconProvider = inject(ICON_PROVIDER);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly iconNames = this.iconProvider.getSupportedIcons();
  readonly isDark = computed(() => this.themeService.theme() === 'dark');

  readonly tabsWithPrototypes = TABS_WITH_PROTOTYPES;
  readonly tabsNoPrototypes = TABS_NO_PROTOTYPES;

  readonly typographyTab = this.makeTabSignal('typography', 'showcase');
  readonly interactiveTab = this.makeTabSignal('interactive', 'showcase');
  readonly labelTab = this.makeTabSignal('label', 'showcase');
  readonly contentTab = this.makeTabSignal('content', 'showcase');
  readonly segmentedTab = this.makeTabSignal('segmented', 'showcase');

  toggleDark(): void {
    this.themeService.toggle();
  }

  private makeTabSignal(key: string, defaultValue: string) {
    const initial = this.route.snapshot.queryParamMap.get(key) ?? defaultValue;
    const sig = signal(initial);
    effect(() => {
      const value = sig();
      const current = this.route.snapshot.queryParamMap.get(key);
      if (current === value) return;
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { [key]: value },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
    return sig;
  }
}
