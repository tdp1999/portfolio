import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AssetGridComponent } from './asset-grid.component';
import { AssetGridMode, AssetGridViewMode, MediaItem } from './asset-grid.types';

function makeItem(id: string, overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id,
    originalFilename: `file-${id}.png`,
    mimeType: 'image/png',
    url: `https://res.cloudinary.com/demo/image/upload/v1/file-${id}.png`,
    format: 'png',
    bytes: 1024,
    width: 200,
    height: 200,
    altText: null,
    caption: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

@Component({
  standalone: true,
  imports: [AssetGridComponent],
  template: `
    <console-asset-grid
      [items]="items()"
      [selectedIds]="selectedIds()"
      [mode]="mode()"
      [viewMode]="viewMode()"
      [loading]="loading()"
      [currentPage]="currentPage()"
      [totalPages]="totalPages()"
      (selectionChange)="lastSelection.set($event)"
      (itemActivated)="lastActivated.set($event)"
      (pageChange)="lastPage.set($event)"
    />
  `,
})
class HostComponent {
  readonly items = signal<MediaItem[]>([makeItem('a'), makeItem('b'), makeItem('c')]);
  readonly selectedIds = signal<string[]>([]);
  readonly mode = signal<AssetGridMode>('multi');
  readonly viewMode = signal<AssetGridViewMode>('grid');
  readonly loading = signal(false);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  readonly lastSelection = signal<string[] | null>(null);
  readonly lastActivated = signal<string | null>(null);
  readonly lastPage = signal<number | null>(null);
}

describe('AssetGridComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  function getItemButtons(): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll<HTMLButtonElement>('.asset-grid__item'));
  }

  describe('selection — multi mode', () => {
    it('adds id on click when unselected', () => {
      getItemButtons()[0].click();
      expect(host.lastSelection()).toEqual(['a']);
    });

    it('removes id on click when already selected', () => {
      host.selectedIds.set(['a', 'b']);
      fixture.detectChanges();
      getItemButtons()[0].click();
      expect(host.lastSelection()).toEqual(['b']);
    });

    it('sets aria-selected on selected items', () => {
      host.selectedIds.set(['b']);
      fixture.detectChanges();
      const btns = getItemButtons();
      expect(btns[0].getAttribute('aria-selected')).toBe('false');
      expect(btns[1].getAttribute('aria-selected')).toBe('true');
    });

    it('uses role=grid for container', () => {
      const container = el.querySelector('.asset-grid__container');
      expect(container?.getAttribute('role')).toBe('grid');
    });
  });

  describe('selection — single mode', () => {
    beforeEach(() => {
      host.mode.set('single');
      fixture.detectChanges();
    });

    it('replaces selection on click', () => {
      host.selectedIds.set(['a']);
      fixture.detectChanges();
      getItemButtons()[1].click();
      expect(host.lastSelection()).toEqual(['b']);
    });

    it('clears when clicking the already-selected item', () => {
      host.selectedIds.set(['a']);
      fixture.detectChanges();
      getItemButtons()[0].click();
      expect(host.lastSelection()).toEqual([]);
    });

    it('uses role=listbox for container', () => {
      const container = el.querySelector('.asset-grid__container');
      expect(container?.getAttribute('role')).toBe('listbox');
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowRight moves focus forward', () => {
      const container = el.querySelector<HTMLElement>('.asset-grid__container');
      container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      const btns = getItemButtons();
      expect(btns[1].tabIndex).toBe(0);
      expect(btns[0].tabIndex).toBe(-1);
    });

    it('Space toggles selection of focused item', () => {
      const container = el.querySelector<HTMLElement>('.asset-grid__container');
      container?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();
      expect(host.lastSelection()).toEqual(['a']);
    });

    it('Enter emits itemActivated for focused item', () => {
      const container = el.querySelector<HTMLElement>('.asset-grid__container');
      container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(host.lastActivated()).toBe('b');
    });

    it('End jumps to last item', () => {
      const container = el.querySelector<HTMLElement>('.asset-grid__container');
      container?.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();
      expect(getItemButtons()[2].tabIndex).toBe(0);
    });
  });

  describe('view mode switching', () => {
    it('renders captions in grid mode', () => {
      host.viewMode.set('grid');
      fixture.detectChanges();
      expect(el.querySelectorAll('.asset-grid__caption').length).toBe(3);
      expect(el.querySelectorAll('.asset-grid__row-meta').length).toBe(0);
    });

    it('renders metadata rows in list mode', () => {
      host.viewMode.set('list');
      fixture.detectChanges();
      expect(el.querySelectorAll('.asset-grid__row-name').length).toBe(3);
      expect(el.querySelectorAll('.asset-grid__caption').length).toBe(0);
    });
  });

  describe('state rendering', () => {
    it('shows skeletons when loading', () => {
      host.loading.set(true);
      fixture.detectChanges();
      expect(el.querySelectorAll('.asset-grid__skeleton-card, .asset-grid__skeleton-row').length).toBeGreaterThan(0);
      expect(getItemButtons().length).toBe(0);
    });

    it('shows empty state when items is empty', () => {
      host.items.set([]);
      fixture.detectChanges();
      expect(el.querySelector('.asset-grid__empty')).toBeTruthy();
    });

    it('emits pageChange on next/prev', () => {
      host.totalPages.set(3);
      host.currentPage.set(2);
      fixture.detectChanges();
      const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.asset-grid__pager button'));
      buttons[1].click();
      expect(host.lastPage()).toBe(3);
      buttons[0].click();
      expect(host.lastPage()).toBe(1);
    });
  });
});
