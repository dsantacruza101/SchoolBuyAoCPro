import { Routes } from '@angular/router';

export const eventsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/events-list/events-list.component').then(
        (m) => m.EventsListComponent,
      ),
  },
];
