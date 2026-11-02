import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
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
 * Phase I: no `AuthService` or `SessionStore`. Business routes are added as children of
 * `Shell` from ISS-03; the session, in ISS-08.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-shell',
  imports: [RouterOutlet, Header, Aside, Footer, ConfirmDialogModule, DrawerModule, ToastModule],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  /** Tailwind `lg`: from here on the Aside is fixed and the button toggles it. */
  private readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  /** Desktop: fixed Aside visible or hidden. */
  readonly sidebarCollapsed = signal(false);

  /** Mobile: Drawer open. */
  readonly mobileOpen = signal(false);

  /**
   * Minimal Phase I menu (ISS-02). ISS-08/09 replace this array with the permission
   * driven navigation.
   */
  readonly items: MenuItem[] = [
    { label: 'Recicladores', icon: 'pi pi-users', routerLink: '/recyclers' },
    { label: 'Prototipo', icon: 'pi pi-desktop', routerLink: '/prototype' },
  ];

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
