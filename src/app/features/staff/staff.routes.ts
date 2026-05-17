import { Routes } from '@angular/router';

export const staffRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/staff-list/staff-list.component').then(
        (m) => m.StaffListComponent,
      ),
  },
];
