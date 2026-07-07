/* Consolidated shared UI library — pipes + sidebar (compound component). */

/* Pipes */
export * from './pipes/readable-size.pipe';
export * from './pipes/file-icon.pipe';
export * from './pipes/mime-category.pipe';
export * from './pipes/is-image.pipe';
export * from './pipes/date-range.pipe';
export * from './pipes/month-year.pipe';
export * from './pipes/cloudinary-thumb.pipe';
export * from './pipes/cloudinary-pdf-thumb.pipe';
export * from './pipes/initials.pipe';
export * from './pipes/translatable.pipe';

/* Sidebar (compound component) */
export { SidebarState } from './components/sidebar/sidebar-state.service';
export { SIDEBAR_CONTEXT } from './components/sidebar/sidebar-context.token';
export type { SidebarContext } from './components/sidebar/sidebar-context.token';
export type { SidebarVariant } from './components/sidebar/sidebar.type';

// Provider
export { SidebarProviderComponent } from './components/sidebar/sidebar-provider.component';

// Layout components
export { SidebarComponent } from './components/sidebar/sidebar.component';
export { SidebarHeaderComponent } from './components/sidebar/sidebar-header.component';
export { SidebarContentComponent } from './components/sidebar/sidebar-content.component';
export { SidebarFooterComponent } from './components/sidebar/sidebar-footer.component';
export { SidebarInsetComponent } from './components/sidebar/sidebar-inset.component';

// Menu system
export { SidebarGroupComponent } from './components/sidebar/sidebar-group.component';
export { SidebarMenuDirective } from './components/sidebar/sidebar-menu.directive';
export { SidebarMenuItemDirective } from './components/sidebar/sidebar-menu-item.directive';
export { SidebarMenuButtonComponent } from './components/sidebar/sidebar-menu-button.component';
export { SidebarMenuBadgeDirective } from './components/sidebar/sidebar-menu-badge.directive';
export { SidebarSeparatorDirective } from './components/sidebar/sidebar-separator.directive';
export { SidebarMenuSkeletonDirective } from './components/sidebar/sidebar-menu-skeleton.directive';

// Submenu
export { SidebarMenuSubComponent } from './components/sidebar/sidebar-menu-sub.component';
export { SidebarMenuSubItemDirective } from './components/sidebar/sidebar-menu-sub-item.directive';
export { SidebarMenuSubButtonComponent } from './components/sidebar/sidebar-menu-sub-button.component';

// Controls
export { SidebarTriggerComponent } from './components/sidebar/sidebar-trigger.component';
export { SidebarRailComponent } from './components/sidebar/sidebar-rail.component';

// Module
export * from './components/sidebar/sidebar.module';
