import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';

/**
 * Application routes.
 *
 * `prototype` keeps its own layout (ISS-01B) and stays public: it makes no session calls.
 * `login` is only for guests. `''` mounts the `Shell` behind `authGuard` (ISS-08): without a
 * session it sends to `/login?returnUrl=…`. Permission checks per screen arrive in ISS-09.
 */
export const routes: Routes = [
  {
    path: 'prototype',
    loadComponent: () => import('./features/prototype/prototype').then((m) => m.Prototype),
  },
  {
    path: 'login',
    title: 'Iniciar sesión · CircularGuajira',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      // Since ISS-07 the default screen is the operations panel.
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Panel · CircularGuajira',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
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
      {
        path: 'routes',
        title: 'Rutas · CircularGuajira',
        loadComponent: () => import('./features/routes/route-list/route-list').then((m) => m.RouteList),
      },
      {
        path: 'collection-points',
        title: 'Puntos de recolección · CircularGuajira',
        loadComponent: () =>
          import('./features/routes/collection-point-list/collection-point-list').then(
            (m) => m.CollectionPointList,
          ),
      },
      {
        path: 'collections',
        title: 'Recolecciones · CircularGuajira',
        loadComponent: () =>
          import('./features/collections/collection-list/collection-list').then((m) => m.CollectionList),
      },
      {
        path: 'collections/new',
        title: 'Nueva recolección · CircularGuajira',
        loadComponent: () =>
          import('./features/collections/collection-form/collection-form').then((m) => m.CollectionForm),
      },
      {
        path: 'weighings',
        title: 'Pesajes · CircularGuajira',
        loadComponent: () =>
          import('./features/collections/weighing-list/weighing-list').then((m) => m.WeighingList),
      },
      {
        path: 'settlements',
        title: 'Liquidaciones · CircularGuajira',
        loadComponent: () =>
          import('./features/settlements/settlement-list/settlement-list').then((m) => m.SettlementList),
      },
      {
        path: 'profile',
        title: 'Mi perfil · CircularGuajira',
        loadComponent: () => import('./features/auth/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'forbidden',
        title: 'Acceso denegado · CircularGuajira',
        loadComponent: () => import('./features/auth/forbidden/forbidden').then((m) => m.Forbidden),
      },
    ],
  },
  { path: '**', redirectTo: 'prototype' },
];
