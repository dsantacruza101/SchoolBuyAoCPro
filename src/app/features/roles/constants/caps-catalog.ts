/**
 * Capability catalog — the full set of granular permission strings used
 * across Security Rules, JWT custom claims, and the UI checkbox grid.
 *
 * Grouped by functional area so the Roles editor can render a readable
 * checkbox grid with section headings rather than a flat alphabetical list.
 */

/** A single capability entry shown in the capability grid. */
export interface CapEntry {
  /** The permission string stored in `capabilities[]` and JWT claims. */
  cap: string;
  /** Short human-readable label shown next to the checkbox. */
  label: string;
}

/** A logical group of related capabilities rendered as one grid section. */
export interface CapGroup {
  /** Section heading. */
  group: string;
  /** Capabilities belonging to this section. */
  caps: CapEntry[];
}

/** All 28 capabilities organised into five display groups. */
export const CAPS_CATALOG: CapGroup[] = [
  {
    group: 'Requests',
    caps: [
      { cap: 'requests.view',          label: 'View requests' },
      { cap: 'requests.create',        label: 'Submit requests' },
      { cap: 'requests.editOwn',       label: 'Edit own requests' },
      { cap: 'requests.editAny',       label: 'Edit any request' },
      { cap: 'requests.approve',       label: 'Approve requests' },
      { cap: 'requests.delete',        label: 'Delete requests' },
      { cap: 'requests.markOrdered',   label: 'Mark as ordered' },
      { cap: 'requests.markReceived',  label: 'Mark as received' },
    ],
  },
  {
    group: 'Budgets',
    caps: [
      { cap: 'budgets.view',     label: 'View budgets' },
      { cap: 'budgets.edit',     label: 'Edit budgets' },
      { cap: 'budgets.allocate', label: 'Allocate budgets' },
      { cap: 'budgets.adjust',   label: 'Adjust budgets' },
      { cap: 'budgets.approve',  label: 'Approve budget adjustments' },
    ],
  },
  {
    group: 'Events',
    caps: [
      { cap: 'events.view',    label: 'View events' },
      { cap: 'events.manage',  label: 'Manage events' },
      { cap: 'events.spend',   label: 'Spend from event budget' },
    ],
  },
  {
    group: 'Directory',
    caps: [
      { cap: 'departments.manage', label: 'Manage departments' },
      { cap: 'staff.manage',       label: 'Manage staff' },
      { cap: 'vendors.manage',     label: 'Manage vendors' },
      { cap: 'grades.manage',      label: 'Manage grade levels & classes' },
    ],
  },
  {
    group: 'System',
    caps: [
      { cap: 'categories.manage', label: 'Manage categories' },
      { cap: 'statuses.manage',   label: 'Manage statuses' },
      { cap: 'settings.edit',     label: 'Edit school settings' },
      { cap: 'audit.view',        label: 'View audit trail' },
      { cap: 'reports.export',    label: 'Export reports' },
      { cap: 'users.invite',      label: 'Invite users' },
      { cap: 'users.disable',     label: 'Disable users' },
      { cap: 'roles.manage',      label: 'Manage roles & permissions' },
    ],
  },
];

/** Flat array of all capability strings — used for validation. */
export const ALL_CAPS: string[] = CAPS_CATALOG.flatMap((g) => g.caps.map((c) => c.cap));

/** The capability that the `admin` role must always retain. */
export const ADMIN_REQUIRED_CAP = 'roles.manage';
