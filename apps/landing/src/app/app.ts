import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LandingShellComponent } from '@portfolio/landing/shared/ui';

@Component({
  imports: [RouterModule, LandingShellComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'landing';
}
