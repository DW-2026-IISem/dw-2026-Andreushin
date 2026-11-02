import { Routes } from '@angular/router';

/**
 * Application routes.
 *
 * `prototype` keeps its own layout (ISS-01B). `''` mounts the `Shell`, whose children are
 * the business screens: in ISS-02 its only child redirects to the prototype; from ISS-03
 * it redirects to the first business screen.
 */
export const routes: Routes = [
  {
    path: 'prototype',
    loadComponent: () => import('./features/prototype/prototype').then((m) => m.Prototype),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [{ path: '', pathMatch: 'full', redirectTo: '/prototype' }],
  },
  { path: '**', redirectTo: 'prototype' },
];
