import { Routes } from '@angular/router';

/** Feature routes for the Roles & Permissions section. */
export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/roles-list/roles-list.component').then((m) => m.RolesListComponent),
  },
];
