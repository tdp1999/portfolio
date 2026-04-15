import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'console-long-form-layout',
  standalone: true,
  templateUrl: './long-form-layout.component.html',
  styleUrl: './long-form-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LongFormLayoutComponent {
  /** Whether the parent console sidebar should be collapsed for this page */
  collapseSidebar = input<boolean>(true);

  /** Emitted so the parent layout can respond to sidebar collapse preference */
  sidebarCollapseChange = output<boolean>();
}
