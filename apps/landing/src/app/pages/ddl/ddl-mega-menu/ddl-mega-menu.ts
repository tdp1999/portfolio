import { ChangeDetectionStrategy, Component, ElementRef, HostListener, signal, viewChild } from '@angular/core';
import { Container, Icon, MegaMenu, type MegaMenuItem } from '@portfolio/landing/shared/ui';

import { DdlConsidered } from '../ddl-considered/ddl-considered';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlStage } from '../ddl-stage/ddl-stage';
import { ITEMS, MEGA_MENU_VARIANTS, SECTIONS } from './ddl-mega-menu.data';
import type { MenuKey, MoreItem } from './ddl-mega-menu.types';

@Component({
  selector: 'landing-ddl-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Icon, MegaMenu, DdlDocPage, DdlSection, DdlDecisionRecord, DdlConsidered, DdlStage],
  templateUrl: './ddl-mega-menu.html',
  styleUrl: './ddl-mega-menu.scss',
})
export class DdlMegaMenu {
  // ── Properties ─────────────────────────────────────────────────────
  protected readonly variants = MEGA_MENU_VARIANTS;
  readonly items = ITEMS;
  readonly nonFeatured = ITEMS.filter((i) => !i.featured);
  readonly featured: MoreItem = ITEMS.find((i) => i.featured) ?? ITEMS[0];

  // The exact items the shipped `landing-mega-menu` receives from the header — the
  // V9b showcase below renders the REAL component with these, so this page always
  // shows what production ships (Products column + Explore/Documents titled columns).
  protected readonly megaMenuItems: readonly MegaMenuItem[] = [
    {
      label: 'Document Engine',
      description: 'A framework-agnostic rich-text engine for structured, versioned documents.',
      href: '/document-engine',
      iconName: 'file-pen',
      product: true,
      cta: 'Explore the engine',
      image: '/menu/document-engine-light.webp',
      imageDark: '/menu/document-engine-dark.webp',
    },
    { label: 'Blog', href: '/blog', section: 'Explore', iconName: 'pen-line' },
    { label: 'Uses', href: '/uses', section: 'Explore', iconName: 'wrench' },
    { label: 'Colophon', href: '/colophon', section: 'Explore', iconName: 'layers' },
    { label: 'DDL', href: '/ddl', section: 'Explore', iconName: 'palette' },
    {
      label: 'Resume',
      hint: 'PDF',
      href: '/resume.pdf',
      kind: 'download',
      iconName: 'file-down',
      section: 'Documents',
    },
  ];

  // V7 sectioned data (Product / Explore / Documents).
  protected readonly sections = SECTIONS;
  protected readonly productItem: MoreItem = SECTIONS[0].items[0];
  protected readonly sideSections = SECTIONS.slice(1);
  // Flattened list (Product → Explore → Documents) for the V9c two-column grid.
  protected readonly allItems: readonly MoreItem[] = SECTIONS.flatMap((s) => s.items);

  // ── Disclosure state (V8 + V9) ──────────────────────────────────────
  // One signal holds whichever demo is open (or null); opening one closes the
  // rest. Keys are 'v8a'…'v9c'. Two roots gate outside-click by key prefix.
  private readonly v8Root = viewChild<ElementRef<HTMLElement>>('v8Root');
  private readonly v9Root = viewChild<ElementRef<HTMLElement>>('v9Root');
  protected readonly openMenu = signal<MenuKey | null>(null);

  // Close on any click outside the open demo's root. Browser-only in effect
  // (document has no listeners during SSR); initial render is closed.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const key = this.openMenu();
    if (!key) return;
    const root = (key.startsWith('v8') ? this.v8Root() : this.v9Root())?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.openMenu.set(null);
    }
  }

  onMenuToggle(key: MenuKey): void {
    this.openMenu.update((current) => (current === key ? null : key));
  }

  onMenuClose(key: MenuKey, trigger?: HTMLButtonElement): void {
    if (this.openMenu() !== key) return;
    this.openMenu.set(null);
    // Return focus to the trigger so keyboard users are not stranded (Esc path).
    trigger?.focus();
  }

  onMenuItemClick(event: Event, key: MenuKey, trigger?: HTMLButtonElement): void {
    // Prototype links are inert; a real menu item would navigate. Either way,
    // activating an item closes the panel (matches the shipped component).
    event.preventDefault();
    this.onMenuClose(key, trigger);
  }
}
