import { Routes } from '@angular/router';

export const vendorsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/vendors-list/vendors-list.component').then(
        (m) => m.VendorsListComponent,
      ),
  },
];
