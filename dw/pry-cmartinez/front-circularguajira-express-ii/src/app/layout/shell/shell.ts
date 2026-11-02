import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification';
import { SessionStore } from '../../core/services/session-store';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../aside/aside';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

/**
 * Persistent application layout.
 *
 * Header, Aside and Footer are mounted **once**; only the central region changes with
 * `<router-outlet />`. Reusing the layout avoids remounting the menu (and losing scroll
 * or focus) on navigation.
 *
 * Since ISS-08 it is the only layout piece that knows the session: it reads `SessionStore`
 * and passes plain data to Header and Aside (which stay presentational), and runs the
 * logout they request. The menu filtered by permissions arrives in ISS-09.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Aside, Footer, ConfirmDialogModule, DrawerModule, ToastModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  readonly session = inject(SessionStore);

  /** Tailwind `lg`: from here on the Aside is fixed and the button toggles it. */
  private readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  /** Desktop: fixed Aside visible or hidden. */
  readonly sidebarCollapsed = signal(false);

  /** Mobile: Drawer open. */
  readonly mobileOpen = signal(false);

  /**
   * Phase I menu (ISS-02 to ISS-07B). ISS-09 replaces this array with the navigation
   * filtered by the session permissions.
   */
  readonly items: MenuItem[] = [
    { label: 'Panel', icon: 'pi pi-chart-bar', routerLink: '/dashboard' },
    { label: 'Recicladores', icon: 'pi pi-users', routerLink: '/recyclers' },
    { label: 'Materiales', icon: 'pi pi-tags', routerLink: '/materials' },
    { label: 'Rutas', icon: 'pi pi-map', routerLink: '/routes' },
    { label: 'Puntos de recolección', icon: 'pi pi-map-marker', routerLink: '/collection-points' },
    { label: 'Recolecciones', icon: 'pi pi-truck', routerLink: '/collections' },
    { label: 'Pesajes', icon: 'pi pi-gauge', routerLink: '/weighings' },
    { label: 'Liquidaciones', icon: 'pi pi-wallet', routerLink: '/settlements' },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/prototype' },
  ];

  readonly username = computed(() => this.session.user()?.username ?? '');

  /** Header user menu. */
  readonly userItems = computed<MenuItem[]>(() => [
    { label: this.session.user()?.email ?? 'Sesión', disabled: true },
    { separator: true },
    { label: 'Mi perfil', icon: 'pi pi-user', routerLink: '/profile' },
    { label: 'Actualizar permisos', icon: 'pi pi-refresh', command: () => this.syncAccess() },
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout() },
  ]);

  /** `POST /api/session/logout` revokes the refresh token; the local session is cleared anyway. */
  logout(): void {
    this.mobileOpen.set(false);
    this.auth.logout().subscribe({
      complete: () => {
        this.notify.info('Sesión cerrada');
        void this.router.navigate(['/login']);
      },
    });
  }

  private syncAccess(): void {
    this.auth.me().subscribe({
      next: () => this.notify.success('Sesión sincronizada', 'Perfil y permisos recargados.'),
    });
  }

  /**
   * One button, two layouts: on desktop it toggles the fixed Aside; below `lg` it opens
   * the Drawer.
   */
  protected onMenuToggle(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }
    this.mobileOpen.set(true);
  }
}
