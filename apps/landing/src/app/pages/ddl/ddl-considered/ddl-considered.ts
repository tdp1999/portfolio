import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Disclosure that collapses the considered/rejected variant visuals beneath the
// page's main showcase (epic §2b/#5). Closed by default for shipped/decided
// pages — the winner is what you see first; the alternatives stay one click away
// as the decision record. Projects the loser variant markup.
@Component({
  selector: 'landing-ddl-considered',
  standalone: true,
  imports: [],
  templateUrl: './ddl-considered.html',
  styleUrl: './ddl-considered.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DdlConsidered {
  readonly label = input('Considered alternatives');
  readonly open = input(false);
}
