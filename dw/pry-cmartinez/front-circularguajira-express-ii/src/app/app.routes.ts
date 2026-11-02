import { Routes } from '@angular/router';

/**
 * Application routes.
 *
 * `prototype` keeps its own layout (ISS-01B). `''` mounts the `Shell`, whose children are
 * the business screens: `/` opens the first one (recyclers).
 */
export const routes: Routes = [
  {
    path: 'prototype',
    loadComponent: () => import('./features/prototype/prototype').then((m) => m.Prototype),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      // The first business screen is the default redirect. ISS-07 will change it to the dashboard.
      { path: '', pathMatch: 'full', redirectTo: 'recyclers' },
      {
        path: 'recyclers',
        title: 'Recicladores · CircularGuajira',
        loadComponent: () =>
          import('./features/recyclers/recycler-list/recycler-list').then((m) => m.RecyclerList),
      },
      {
        path: 'materials',
        title: 'Materiales · CircularGuajira',
        loadComponent: () =>
          import('./features/materials/material-list/material-list').then((m) => m.MaterialList),
      },
    ],
  },
  { path: '**', redirectTo: 'prototype' },
];
