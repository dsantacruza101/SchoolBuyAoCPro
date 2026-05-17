import { Routes } from '@angular/router';

export const departmentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/departments-list/departments-list.component').then(
        (m) => m.DepartmentsListComponent,
      ),
  },
];
