/**
 * Navigation catalog: each option declares the grant that opens its screen, the same one
 * its route requires in `app.routes.ts`. The Shell filters it with `SessionStore`; no role
 * is hardcoded here.
 */
export interface NavItem {
  label: string;
  icon: string;
  routerLink: string;
  permission?: string;
}

export interface NavGroup {
  label: string;
  icon: string;
  /** Only with a session (hidden in lab mode). The Security group of ISS-10 uses it. */
  authOnly?: boolean;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: 'Operación',
    icon: 'pi pi-briefcase',
    items: [
      { label: 'Panel', icon: 'pi pi-chart-bar', routerLink: '/dashboard', permission: 'GET /api/collections' },
      { label: 'Recicladores', icon: 'pi pi-users', routerLink: '/recyclers', permission: 'GET /api/recyclers' },
      { label: 'Materiales', icon: 'pi pi-tags', routerLink: '/materials', permission: 'GET /api/materials' },
      { label: 'Rutas', icon: 'pi pi-map', routerLink: '/routes', permission: 'GET /api/routes' },
      {
        label: 'Puntos de recolección',
        icon: 'pi pi-map-marker',
        routerLink: '/collection-points',
        permission: 'GET /api/collection-points',
      },
      { label: 'Recolecciones', icon: 'pi pi-truck', routerLink: '/collections', permission: 'GET /api/collections' },
      { label: 'Pesajes', icon: 'pi pi-gauge', routerLink: '/weighings', permission: 'GET /api/weighings' },
      { label: 'Liquidaciones', icon: 'pi pi-wallet', routerLink: '/settlements', permission: 'GET /api/settlements' },
    ],
  },
  {
    label: 'Laboratorio',
    icon: 'pi pi-flask',
    items: [{ label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/prototype' }],
  },
];
