import { Component } from '@angular/core';

@Component({
  selector: 'landing-section',
  standalone: true,
  template: `
    <section class="section">
      <ng-content />
    </section>
  `,
  styleUrl: './section.component.scss',
})
export class SectionComponent {}
