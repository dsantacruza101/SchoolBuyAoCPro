import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards';

export const requestsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/requests-list/requests-list.component').then(
        (m) => m.RequestsListComponent,
      ),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { cap: 'requests.create', title: 'New Request', subtitle: 'Submit a purchase request' },
    loadComponent: () =>
      import('./pages/request-new/request-new.component').then(
        (m) => m.RequestNewComponent,
      ),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { cap: 'requests.view', title: 'Request Detail' },
    loadComponent: () =>
      import('./pages/request-detail/request-detail.component').then(
        (m) => m.RequestDetailComponent,
      ),
  },
];
