import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/guards';
import { ShellComponent } from './core/layout/shell/shell.component';

/**
 * Top-level route configuration for SchoolBuy AoC Pro.
 *
 * Public routes (login) sit at the top level.
 * All authenticated pages are children of `ShellComponent`, which renders
 * the sidebar + topbar layout. Each child route that requires a specific
 * capability declares it via `data: { cap: '...' }` for `roleGuard`.
 *
 * Pattern for adding new feature routes:
 * ```ts
 * {
 *   path: 'feature',
 *   canActivate: [roleGuard],
 *   data: { cap: 'feature.cap', title: 'Feature Title', subtitle: 'Description' },
 *   loadChildren: () => import('./features/feature/feature.routes').then(m => m.routes)
 * }
 * ```
 */
export const routes: Routes = [
  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then((m) => m.LoginComponent),
  },

  // ── Authenticated — wrapped in the shell layout ────────────────────────────
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { cap: 'budgets.view', title: 'Dashboard', subtitle: 'Live purchasing overview' },
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      {
        path: 'no-access',
        data: { title: 'No access' },
        loadComponent: () =>
          import('./core/pages/no-access/no-access.component').then((m) => m.NoAccessComponent),
      },

      {
        path: 'roles',
        canActivate: [roleGuard],
        data: { cap: 'roles.manage', title: 'Roles & Permissions', subtitle: 'Define what each role can do' },
        loadChildren: () =>
          import('./features/roles/roles.routes').then((m) => m.rolesRoutes),
      },

      {
        path: 'users',
        canActivate: [roleGuard],
        data: { cap: 'users.invite', title: 'Users & Access', subtitle: 'Manage members and invites' },
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.usersRoutes),
      },

      {
        path: 'grade-levels',
        canActivate: [roleGuard],
        data: { cap: 'grades.manage', title: 'Grade Levels', subtitle: 'Academic levels used across the school' },
        loadChildren: () =>
          import('./features/grade-levels/grade-levels.routes').then((m) => m.gradeLevelsRoutes),
      },

      // Feature routes are added here as tickets are completed (US-006 +)
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./core/pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
