import { Routes } from '@angular/router';

/**
 * Application routes.
 *
 * ISS-01B introduces the router with a real screen. `loadComponent` downloads
 * `Prototype` only when its URL is visited: the initial bundle does not include it.
 */
export const routes: Routes = [
  {
    path: 'prototype',
    loadComponent: () => import('./features/prototype/prototype').then((m) => m.Prototype),
  },
  { path: '', pathMatch: 'full', redirectTo: 'prototype' },
  { path: '**', redirectTo: 'prototype' },
];
