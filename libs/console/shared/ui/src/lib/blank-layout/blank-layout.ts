import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'console-blank-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './blank-layout.html',
  styleUrl: './blank-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleBlankLayoutComponent {}
