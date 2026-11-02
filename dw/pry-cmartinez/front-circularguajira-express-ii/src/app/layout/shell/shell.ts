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
import { NAV } from './nav.config';
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
 * logout they request. Since ISS-09 the menu is filtered by the session permissions.
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
   * Side menu derived from `NAV` and the session grants: an option appears only if the
   * session may open its screen, and a group without options disappears. It is a
   * `computed`, so after "Actualizar permisos" the menu changes without reloading.
   */
  readonly items = computed<MenuItem[]>(() =>
    NAV.filter((group) => !group.authOnly || this.session.authEnabled)
      .map<MenuItem>((group) => ({
        label: group.label,
        icon: group.icon,
        expanded: true,
        items: group.items
          .filter((item) => !item.permission || this.session.canPermission(item.permission))
          .map<MenuItem>((item) => ({
            label: item.label,
            icon: item.icon,
            routerLink: item.routerLink,
          })),
      }))
      .filter((group) => (group.items?.length ?? 0) > 0),
  );

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
