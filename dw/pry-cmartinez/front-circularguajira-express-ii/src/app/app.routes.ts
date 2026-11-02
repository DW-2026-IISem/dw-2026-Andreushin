import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { authOnlyGuard } from './core/guards/auth-only-guard';
import { guestGuard } from './core/guards/guest-guard';
import { permissionGuard } from './core/guards/permission-guard';

/**
 * Application routes.
 *
 * `prototype` keeps its own layout (ISS-01B) and stays public: it makes no session calls.
 * `login` is only for guests. `''` mounts the `Shell` behind `authGuard` (ISS-08): without a
 * session it sends to `/login?returnUrl=…`. Since ISS-09 each business screen declares the
 * grant it needs (`permissionGuard` + `data.permission`, the same one the menu uses); without
 * it, `/forbidden`. The panel asks for the weakest grant every operational role has.
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
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/collections' },
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'recyclers',
        title: 'Recicladores · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/recyclers' },
        loadComponent: () =>
          import('./features/recyclers/recycler-list/recycler-list').then((m) => m.RecyclerList),
      },
      {
        path: 'materials',
        title: 'Materiales · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/materials' },
        loadComponent: () =>
          import('./features/materials/material-list/material-list').then((m) => m.MaterialList),
      },
      {
        path: 'routes',
        title: 'Rutas · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/routes' },
        loadComponent: () => import('./features/routes/route-list/route-list').then((m) => m.RouteList),
      },
      {
        path: 'collection-points',
        title: 'Puntos de recolección · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/collection-points' },
        loadComponent: () =>
          import('./features/routes/collection-point-list/collection-point-list').then(
            (m) => m.CollectionPointList,
          ),
      },
      {
        path: 'collections',
        title: 'Recolecciones · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/collections' },
        loadComponent: () =>
          import('./features/collections/collection-list/collection-list').then((m) => m.CollectionList),
      },
      {
        path: 'collections/new',
        title: 'Nueva recolección · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'POST /api/collections' },
        loadComponent: () =>
          import('./features/collections/collection-form/collection-form').then((m) => m.CollectionForm),
      },
      {
        path: 'weighings',
        title: 'Pesajes · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/weighings' },
        loadComponent: () =>
          import('./features/collections/weighing-list/weighing-list').then((m) => m.WeighingList),
      },
      {
        path: 'settlements',
        title: 'Liquidaciones · CircularGuajira',
        canActivate: [permissionGuard],
        data: { permission: 'GET /api/settlements' },
        loadComponent: () =>
          import('./features/settlements/settlement-list/settlement-list').then((m) => m.SettlementList),
      },
      // ISS-10: RBAC administration. Only with a session (authOnlyGuard) and with the grant.
      {
        path: 'admin/users',
        title: 'Usuarios · CircularGuajira',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/users' },
        loadComponent: () => import('./features/admin/users/user-list/user-list').then((m) => m.UserList),
      },
      {
        path: 'admin/roles',
        title: 'Roles · CircularGuajira',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/roles' },
        loadComponent: () => import('./features/admin/roles/role-list/role-list').then((m) => m.RoleList),
      },
      {
        path: 'admin/resources',
        title: 'Recursos · CircularGuajira',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/resources' },
        loadComponent: () => import('./features/admin/resources/resource-list/resource-list').then((m) => m.ResourceList),
      },
      {
        path: 'admin/role-users',
        title: 'Asignaciones · CircularGuajira',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/role-users' },
        loadComponent: () => import('./features/admin/role-users/role-user-list/role-user-list').then((m) => m.RoleUserList),
      },
      {
        path: 'admin/resource-roles',
        title: 'Concesiones · CircularGuajira',
        canActivate: [authOnlyGuard, permissionGuard],
        data: { permission: 'GET /api/resource-roles' },
        loadComponent: () => import('./features/admin/resource-roles/resource-role-list/resource-role-list').then((m) => m.ResourceRoleList),
      },
      {
        path: 'profile',
        title: 'Mi perfil · CircularGuajira',
        // Every authenticated user may see its own session: no permissionGuard.
        canActivate: [authOnlyGuard],
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
