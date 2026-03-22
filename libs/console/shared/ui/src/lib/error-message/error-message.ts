import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'console-error-message',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <p role="alert" class="text-sm text-red-500">{{ message() }}</p> `,
})
export class ErrorMessageComponent {
  message = input.required<string>();
}
