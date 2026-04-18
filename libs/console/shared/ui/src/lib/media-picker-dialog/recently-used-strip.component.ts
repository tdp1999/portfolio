import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CloudinaryThumbPipe, IsImagePipe } from '@portfolio/shared/ui-pipes';
import { MatIconModule } from '@angular/material/icon';
import type { MediaItem } from '@portfolio/console/shared/util';

@Component({
  selector: 'console-recently-used-strip',
  standalone: true,
  imports: [MatIconModule, CloudinaryThumbPipe, IsImagePipe],
  template: `
    @if (visible()) {
      <section class="recent-strip" aria-label="Recently used media">
        <span class="recent-strip__label text-stat-label">Recent</span>
        <ul class="recent-strip__list" role="list">
          @for (item of items(); track item.id) {
            <li>
              <button
                type="button"
                class="recent-strip__item"
                [class.recent-strip__item--selected]="selectedSet().has(item.id)"
                [attr.aria-label]="'Select ' + item.originalFilename"
                [attr.aria-pressed]="selectedSet().has(item.id)"
                (click)="pick.emit(item.id)"
              >
                @if (item.mimeType | isImage) {
                  <img
                    [src]="item.url | cloudinaryThumb"
                    [alt]="item.altText ?? item.originalFilename"
                    loading="lazy"
                  />
                } @else {
                  <mat-icon class="recent-strip__icon">insert_drive_file</mat-icon>
                }
              </button>
            </li>
          }
        </ul>
      </section>
    }
  `,
  styles: `
    .recent-strip {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    .recent-strip__label {
      flex-shrink: 0;
    }
    .recent-strip__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      gap: 8px;
    }
    .recent-strip__item {
      width: 44px;
      height: 44px;
      padding: 0;
      border: 2px solid var(--color-border);
      border-radius: 8px;
      background: var(--color-surface);
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s;

      &:hover {
        border-color: color-mix(in srgb, var(--color-primary) 60%, transparent);
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      &.recent-strip__item--selected {
        border-color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 10%, transparent);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    .recent-strip__icon {
      color: var(--color-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentlyUsedStripComponent {
  readonly items = input.required<readonly MediaItem[]>();
  readonly selectedIds = input<readonly string[]>([]);
  readonly pick = output<string>();

  protected readonly selectedSet = computed(() => new Set(this.selectedIds()));
  protected readonly visible = computed(() => this.items().length > 0);
}
