import { computed, inject } from '@angular/core';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BadgeModule } from 'primeng/badge';

import { AuthService } from '../../../features/auth/services';
import { NAV_ITEMS, NavItem, SECTION_LABELS } from '../nav-items';

/** Groups an array of `NavItem` by their `section` field, preserving insertion order. */
function groupBySection(items: NavItem[]): Map<NavItem['section'], NavItem[]> {
  const map = new Map<NavItem['section'], NavItem[]>();
  for (const item of items) {
    const bucket = map.get(item.section) ?? [];
    bucket.push(item);
    map.set(item.section, bucket);
  }
  return map;
}

/**
 * Sidebar navigation component.
 *
 * Renders the fixed left-hand sidebar containing the SchoolBuy branding and
 * all navigation items the current user is authorised to see. Items are
 * grouped by section and filtered against the user's capability list; items
 * whose required capability the user lacks are never rendered.
 *
 * This component is display-only — routing is handled by Angular Router.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BadgeModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  /** Section-keyed map of nav items visible to the current user. */
  readonly sections = computed(() => {
    const visible = NAV_ITEMS.filter((item) => !item.cap || this.auth.hasCap(item.cap));
    return groupBySection(visible);
  });

  /** Display name of the school shown below the app name. */
  readonly schoolName = computed(() => 'Academy of the City');

  /** Expose section labels to the template. */
  readonly sectionLabels = SECTION_LABELS;
}
