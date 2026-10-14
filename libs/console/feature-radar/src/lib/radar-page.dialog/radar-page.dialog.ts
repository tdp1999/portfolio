import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';
import RadarBriefList from '../radar-brief.list/radar-brief.list';
import RadarRunList from '../radar-run.list/radar-run.list';

/** Which list page a `radar-page.dialog` route opens, set in the route's `data.page`. */
export type RadarDialogPage = 'runs' | 'briefs';

/**
 * A routed popup: `/radar/runs` and `/radar/briefs` are child routes of the Feed, so the Feed stays
 * underneath and the list opens over it in a big dialog. The URL stays shareable, and a direct visit
 * lands on the Feed with the popup open. The route owns the dialog: closing it (Esc, backdrop, X)
 * navigates back to the Feed, and leaving the route (a run's or a brief's full page) closes it.
 * Renders nothing itself.
 */
@Component({
  selector: 'console-radar-page-dialog',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class RadarPageDialog {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly breakpoints = inject(BreakpointObserverService);

  constructor() {
    const page = this.route.snapshot.data['page'] as RadarDialogPage;
    // A phone gets the whole screen; anything wider a big popup with the Feed showing around it.
    const size = this.breakpoints.isAtLeast('tablet')
      ? { width: '1200px', maxWidth: 'calc(100vw - 32px)', height: '85dvh', maxHeight: 'calc(100dvh - 32px)' }
      : { width: '100vw', maxWidth: '100vw', height: '100%', maxHeight: '100%' };
    // closeOnNavigation off: the Feed rewrites its query params on load, which must not close the popup.
    const ref = this.dialog.open<RadarRunList | RadarBriefList>(page === 'briefs' ? RadarBriefList : RadarRunList, {
      ...size,
      autoFocus: 'dialog',
      closeOnNavigation: false,
      ariaLabel: page === 'briefs' ? 'Radar briefs' : 'Radar runs',
    });

    let leaving = false;
    ref.afterClosed().subscribe(() => {
      // Closed by the user: back to the Feed, its filters kept. Closed by leaving the route: nothing to do.
      if (!leaving) void this.router.navigate(['/radar'], { queryParamsHandling: 'preserve' });
    });
    inject(DestroyRef).onDestroy(() => {
      leaving = true;
      ref.close();
    });
  }
}
