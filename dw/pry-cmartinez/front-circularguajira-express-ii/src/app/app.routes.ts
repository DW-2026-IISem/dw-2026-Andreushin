import { Routes } from '@angular/router';

/**
 * Application routes.
 *
 * `prototype` keeps its own layout (ISS-01B). `''` mounts the `Shell`, whose children are
 * the business screens: `/` opens the operations panel.
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
    ],
  },
  { path: '**', redirectTo: 'prototype' },
];
