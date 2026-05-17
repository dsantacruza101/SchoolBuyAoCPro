import { Routes } from '@angular/router';

/** Feature routes for the Grade Levels section. */
export const gradeLevelsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/grade-levels-list/grade-levels-list.component').then(
        (m) => m.GradeLevelsListComponent,
      ),
  },
];
