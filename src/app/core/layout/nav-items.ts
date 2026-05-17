/**
 * Navigation configuration for the app shell sidebar.
 *
 * Each `NavItem` declares the capability required to see it. If the user lacks
 * that capability, the sidebar omits the item entirely.  The same capability
 * string is set on the route `data.cap` field and checked by `roleGuard`, so
 * there is a single source of truth for access control per section.
 *
 * Adding a new feature page: append one entry to `NAV_ITEMS`. No layout
 * changes are needed — the sidebar renders from this array.
 */

/** A single entry in the sidebar navigation. */
export interface NavItem {
  /** Human-readable label shown in the sidebar. */
  label: string;
  /** PrimeIcons CSS class (e.g. `'pi pi-th-large'`). */
  icon: string;
  /** Absolute router path the link navigates to. */
  route: string;
  /** Capability string the user must hold to see this item. Omit for public items. */
  cap?: string;
  /** Optional live badge count (e.g. pending requests). Evaluated reactively. */
  badge?: () => number;
  /** Logical section this item belongs to — used to render section headings. */
  section: 'overview' | 'purchasing' | 'finance' | 'directory' | 'system';
}

/** All sidebar navigation items in display order. */
export const NAV_ITEMS: NavItem[] = [
  { section: 'overview',   label: 'Dashboard',           icon: 'pi pi-th-large',  route: '/dashboard',    cap: 'budgets.view' },
  { section: 'purchasing', label: 'Requests',             icon: 'pi pi-list',      route: '/requests',     cap: 'requests.view' },
  { section: 'purchasing', label: 'Submit Request',       icon: 'pi pi-pencil',    route: '/requests/new', cap: 'requests.create' },
  { section: 'finance',    label: 'Budgets',              icon: 'pi pi-wallet',    route: '/budgets',      cap: 'budgets.view' },
  { section: 'finance',    label: 'Events',               icon: 'pi pi-calendar',  route: '/events',       cap: 'events.manage' },
  { section: 'finance',    label: 'Audit Trail',          icon: 'pi pi-search',    route: '/audit',        cap: 'audit.view' },
  { section: 'directory',  label: 'Grade Levels',          icon: 'pi pi-graduation-cap', route: '/grade-levels', cap: 'grades.manage' },
  { section: 'directory',  label: 'Teachers & Staff',     icon: 'pi pi-users',     route: '/staff',        cap: 'staff.manage' },
  { section: 'directory',  label: 'Vendors',              icon: 'pi pi-shop',      route: '/vendors',      cap: 'vendors.manage' },
  { section: 'directory',  label: 'Departments',          icon: 'pi pi-sitemap',   route: '/departments',  cap: 'departments.manage' },
  { section: 'system',     label: 'Users & Access',        icon: 'pi pi-user-edit', route: '/users',        cap: 'users.invite' },
  { section: 'system',     label: 'Roles & Permissions',  icon: 'pi pi-shield',    route: '/roles',        cap: 'roles.manage' },
  { section: 'system',     label: 'Export & Reports',     icon: 'pi pi-download',  route: '/export',       cap: 'reports.export' },
  { section: 'system',     label: 'Settings',             icon: 'pi pi-cog',       route: '/settings',     cap: 'settings.edit' },
];

/** Display labels for each sidebar section heading. */
export const SECTION_LABELS: Record<NavItem['section'], string> = {
  overview:   'Overview',
  purchasing: 'Purchasing',
  finance:    'Finance',
  directory:  'Directory',
  system:     'System',
};
