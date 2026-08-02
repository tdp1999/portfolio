import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Figure, Gallery, type GalleryImage, type InPageSection } from '@portfolio/landing/shared/ui';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

@Component({
  selector: 'landing-ddl-figure',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Figure, Gallery, DdlDocPage, DdlSection],
  templateUrl: './ddl-figure.html',
})
export class DdlFigure {
  protected readonly sections: readonly InPageSection[] = [
    { id: 'showcase', title: 'Showcase', level: 2 },
    { id: 'usage', title: 'Usage', level: 2 },
  ];

  /** Two cells → the clamp is on, and both captions stay one line high. */
  protected readonly clampDemoPair: readonly GalleryImage[] = [
    {
      url: 'https://placehold.co/640x480/1a2030/cbd5e1.png?text=Long+caption',
      alt: 'A gallery cell whose caption runs longer than the cell is wide',
      caption:
        'This caption runs far longer than the cell is wide, so it truncates instead of wrapping onto four lines',
    },
    {
      url: 'https://placehold.co/640x480/11151c/cbd5e1.png?text=Short+caption',
      alt: 'A gallery cell with a short caption',
      caption: 'Short label',
    },
  ];

  /** One cell → no neighbour to misalign, so the same caption wraps in full. */
  protected readonly clampDemoSolo: readonly GalleryImage[] = [this.clampDemoPair[0]];
}
