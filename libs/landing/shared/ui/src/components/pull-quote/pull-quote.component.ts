import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'landing-pull-quote',
  standalone: true,
  template: `
    <blockquote class="landing-pull-quote">
      <p class="landing-pull-quote__body"><ng-content /></p>
      @if (cite()) {
        <footer class="landing-pull-quote__cite">— {{ cite() }}</footer>
      }
    </blockquote>
  `,
  styleUrl: './pull-quote.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PullQuoteComponent {
  readonly cite = input<string>('');
}
