import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ButtonComponent,
  ContainerComponent,
  SectionComponent,
  IconComponent,
  CardComponent,
  BadgeComponent,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-feature-home',
  imports: [
    RouterLink,
    ButtonComponent,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    CardComponent,
    BadgeComponent,
  ],
  templateUrl: './feature-home.html',
  styleUrl: './feature-home.scss',
})
export class FeatureHome {
  projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with real-time inventory.',
      icon: 'shopping-cart',
      technologies: ['Angular', 'NestJS', 'PostgreSQL'],
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'Collaborative task management with real-time updates.',
      icon: 'check-square',
      technologies: ['React', 'Node.js', 'MongoDB'],
    },
    {
      id: 3,
      title: 'Analytics Dashboard',
      description: 'Real-time analytics dashboard with interactive charts.',
      icon: 'bar-chart',
      technologies: ['Vue', 'D3.js', 'Firebase'],
    },
  ];
}
