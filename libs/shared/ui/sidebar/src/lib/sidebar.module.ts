import { NgModule } from '@angular/core';

import { SidebarComponent } from './sidebar.component';
import { SidebarProviderComponent } from './sidebar-provider.component';
import { SidebarHeaderComponent } from './sidebar-header.component';
import { SidebarContentComponent } from './sidebar-content.component';
import { SidebarFooterComponent } from './sidebar-footer.component';
import { SidebarInsetComponent } from './sidebar-inset.component';
import { SidebarGroupComponent } from './sidebar-group.component';
import { SidebarMenuDirective } from './sidebar-menu.directive';
import { SidebarMenuItemDirective } from './sidebar-menu-item.directive';
import { SidebarMenuButtonComponent } from './sidebar-menu-button.component';
import { SidebarMenuBadgeDirective } from './sidebar-menu-badge.directive';
import { SidebarSeparatorDirective } from './sidebar-separator.directive';
import { SidebarMenuSkeletonDirective } from './sidebar-menu-skeleton.directive';
import { SidebarTriggerComponent } from './sidebar-trigger.component';
import { SidebarRailComponent } from './sidebar-rail.component';
import { SidebarMenuSubComponent } from './sidebar-menu-sub.component';
import { SidebarMenuSubItemDirective } from './sidebar-menu-sub-item.directive';
import { SidebarMenuSubButtonComponent } from './sidebar-menu-sub-button.component';

const SIDEBAR_COMPONENTS = [
  SidebarProviderComponent,
  SidebarComponent,
  SidebarHeaderComponent,
  SidebarContentComponent,
  SidebarFooterComponent,
  SidebarInsetComponent,
  SidebarGroupComponent,
  SidebarMenuButtonComponent,
  SidebarTriggerComponent,
  SidebarRailComponent,
  SidebarMenuSubComponent,
  SidebarMenuSubButtonComponent,
] as const;

const SIDEBAR_DIRECTIVES = [
  SidebarMenuDirective,
  SidebarMenuItemDirective,
  SidebarMenuBadgeDirective,
  SidebarSeparatorDirective,
  SidebarMenuSkeletonDirective,
  SidebarMenuSubItemDirective,
] as const;

@NgModule({
  imports: [...SIDEBAR_COMPONENTS, ...SIDEBAR_DIRECTIVES],
  exports: [...SIDEBAR_COMPONENTS, ...SIDEBAR_DIRECTIVES],
})
export class SidebarModule {}
