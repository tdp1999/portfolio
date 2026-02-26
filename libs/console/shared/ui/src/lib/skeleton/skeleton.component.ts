import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'console-skeleton',
  standalone: true,
  template: `
    <div
      [class]="shapeClass()"
      [style.width]="width()"
      [style.height]="resolvedHeight()"
      class="animate-pulse bg-gray-200 dark:bg-gray-700"
    ></div>
  `,
})
export class SkeletonComponent {
  shape = input<'text' | 'rectangle' | 'circle'>('text');
  width = input('100%');
  height = input('');

  shapeClass = computed(() => {
    switch (this.shape()) {
      case 'circle':
        return 'rounded-full';
      case 'rectangle':
        return 'rounded';
      case 'text':
        return 'h-4 rounded';
    }
  });

  resolvedHeight = computed(() => {
    if (this.height()) return this.height();
    return this.shape() === 'circle' ? this.width() : '';
  });
}
