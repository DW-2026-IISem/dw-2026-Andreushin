import { Component, signal } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DrawerModule } from 'primeng/drawer';
import { watchMediaQuery } from '../../core/utils/media-query';
import { Aside } from '../../layout/aside/aside';
import { Footer } from '../../layout/footer/footer';
import { Header } from '../../layout/header/header';

/**
 * Prototype screen.
 *
 * The only stateful component in ISS-01B: it keeps the chosen title and the menu
 * state. The layout only receives data through `input()`, so ISS-02 can reuse it
 * without duplicating Header, Aside or Footer.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-prototype',
  imports: [Aside, ButtonModule, CardModule, DrawerModule, Footer, Header],
  templateUrl: './prototype.html',
  styleUrl: './prototype.css',
})
export class Prototype {
  /** Tailwind `lg`: from here on the Aside is fixed and the button toggles it. */
  private readonly isDesktop = watchMediaQuery('(min-width: 1024px)');

  /** Desktop: the fixed Aside hides and the content widens. */
  readonly sidebarCollapsed = signal(false);

  /** Mobile: the Drawer opens from the button and closes when an option is chosen. */
  readonly mobileOpen = signal(false);

  /** Content title. Changes when a menu option is chosen, without HTTP. */
  readonly title = signal('Inicio');

  /**
   * Menu in PrimeNG's `MenuItem` format.
   *
   * `command` runs a function when the option is chosen. It does not navigate yet: it
   * only changes the title. In ISS-02 each command points to a real route.
   */
  readonly items: MenuItem[] = [
    { label: 'Inicio', icon: 'pi pi-home', command: () => this.select('Inicio') },
    { label: 'Recicladores', icon: 'pi pi-users', command: () => this.select('Recicladores') },
    { label: 'Materiales y tarifas', icon: 'pi pi-tags', command: () => this.select('Materiales y tarifas') },
    { label: 'Rutas de recolección', icon: 'pi pi-map', command: () => this.select('Rutas de recolección') },
    { label: 'Pesajes y liquidaciones', icon: 'pi pi-receipt', command: () => this.select('Pesajes y liquidaciones') },
  ];

  /**
   * One button, two layouts: on desktop it toggles the fixed Aside; below `lg` it
   * opens the Drawer (where the fixed Aside does not fit).
   */
  protected onMenuToggle(): void {
    if (this.isDesktop()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }
    this.mobileOpen.set(true);
  }

  /** The single entry point to the state: all five commands use it. */
  protected select(title: string): void {
    this.title.set(title);
    this.mobileOpen.set(false);
  }
}
