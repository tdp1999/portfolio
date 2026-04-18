import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AssetFilterBarComponent } from './asset-filter-bar.component';
import { MimeGroup, SortOption, UploadFolder } from './asset-filter-bar.types';

const DEBOUNCE_MS = 30;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Component({
  standalone: true,
  imports: [AssetFilterBarComponent],
  template: `
    <console-asset-filter-bar
      [search]="search()"
      [mimeGroup]="mimeGroup()"
      [folder]="folder()"
      [sort]="sort()"
      [debounce]="debounce"
      (searchChange)="lastSearch.set($event)"
      (mimeGroupChange)="lastMime.set($event)"
      (folderChange)="lastFolder.set($event)"
      (sortChange)="lastSort.set($event)"
      (clearAll)="onClearAll()"
    />
  `,
})
class HostComponent {
  readonly debounce = DEBOUNCE_MS;
  readonly search = signal('');
  readonly mimeGroup = signal<MimeGroup | null>(null);
  readonly folder = signal<UploadFolder | null>(null);
  readonly sort = signal<SortOption>('createdAt_desc');

  readonly lastSearch = signal<string | null>(null);
  readonly lastMime = signal<MimeGroup | null | 'unset'>('unset');
  readonly lastFolder = signal<UploadFolder | null | 'unset'>('unset');
  readonly lastSort = signal<SortOption | null>(null);
  readonly clearAllCalls = signal(0);

  onClearAll(): void {
    this.clearAllCalls.update((n) => n + 1);
  }
}

describe('AssetFilterBarComponent', () => {
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

  function typeInSearch(value: string): void {
    const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function chipButtons(): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll<HTMLButtonElement>('.asset-filter-bar__chips .chip-toggle'));
  }

  describe('search debounce', () => {
    it('emits once after debounce elapses', async () => {
      typeInSearch('foo');
      expect(host.lastSearch()).toBeNull();
      await wait(DEBOUNCE_MS + 20);
      expect(host.lastSearch()).toBe('foo');
    });

    it('coalesces rapid keystrokes into one emit', async () => {
      typeInSearch('f');
      typeInSearch('fo');
      typeInSearch('foo');
      await wait(DEBOUNCE_MS + 20);
      expect(host.lastSearch()).toBe('foo');
    });
  });

  describe('mime chip toggle', () => {
    it('emits selected group when chip clicked', () => {
      // chips[0] is "All"; chips[1] is first mime group ("image")
      chipButtons()[1].click();
      expect(host.lastMime()).toBe('image');
    });

    it('emits null when already-selected chip is clicked again', () => {
      host.mimeGroup.set('image');
      fixture.detectChanges();
      chipButtons()[1].click();
      expect(host.lastMime()).toBeNull();
    });

    it('All chip resets mime group to null', () => {
      host.mimeGroup.set('pdf');
      fixture.detectChanges();
      chipButtons()[0].click();
      expect(host.lastMime()).toBeNull();
    });

    it('marks selected chip with aria-pressed=true', () => {
      host.mimeGroup.set('video');
      fixture.detectChanges();
      const videoChip = chipButtons().find((b) => b.textContent?.trim() === 'Video')!;
      expect(videoChip.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('clear all', () => {
    it('is hidden when no filters are active', () => {
      expect(el.querySelector('.asset-filter-bar__clear')).toBeNull();
    });

    it('is shown when any filter is active', () => {
      host.mimeGroup.set('image');
      fixture.detectChanges();
      expect(el.querySelector('.asset-filter-bar__clear')).not.toBeNull();
    });

    it('resets all outputs and emits clearAll', async () => {
      host.mimeGroup.set('pdf');
      host.folder.set('projects');
      host.sort.set('filename_asc');
      host.search.set('query');
      fixture.detectChanges();
      await wait(DEBOUNCE_MS + 20);

      const clearBtn = el.querySelector<HTMLButtonElement>('.asset-filter-bar__clear')!;
      clearBtn.click();
      await wait(DEBOUNCE_MS + 20);

      expect(host.lastMime()).toBeNull();
      expect(host.lastFolder()).toBeNull();
      expect(host.lastSort()).toBe('createdAt_desc');
      expect(host.lastSearch()).toBe('');
      expect(host.clearAllCalls()).toBe(1);
    });
  });
});
