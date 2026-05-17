import { Routes } from '@angular/router';

/** Feature routes for the Users & Access section. */
export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then((m) => m.UsersListComponent),
  },
];
