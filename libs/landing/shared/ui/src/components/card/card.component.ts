import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'landing-card',
  imports: [],
  template: `
    <div [class]="cardClasses()">
      <ng-content />
    </div>
  `,
  styleUrl: './card.component.scss',
})
export class CardComponent {
  elevated = input<boolean>(false);

  cardClasses = computed(() => {
    const classes = ['card'];
    if (this.elevated()) {
      classes.push('card--elevated');
    }
    return classes.join(' ');
  });
}
