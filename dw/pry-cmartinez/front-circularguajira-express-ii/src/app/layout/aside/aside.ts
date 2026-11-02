import { Component, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PanelMenuModule } from 'primeng/panelmenu';

/**
 * Application side menu.
 *
 * Pure presentation: receives the already built menu through `input()` and reports
 * navigation with `output()`. It knows nothing about routes, permissions or the API.
 */
@Component({
  host: { class: 'block h-full' },
  selector: 'app-aside',
  imports: [ButtonModule, PanelMenuModule],
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {
  readonly appName = input('CircularGuajira Express II');

  /** Menu options, in PrimeNG's `MenuItem` format. */
  readonly items = input<MenuItem[]>([]);

  /** Session data with defaults: ISS-08 fills them in. */
  readonly showSession = input(false);
  readonly username = input('');
  readonly roleLabel = input('Sin rol');
  readonly permissionCount = input(0);

  /** Notice to the parent: an option was selected (the mobile Drawer uses it). */
  readonly navigated = output<void>();

  /** Notice to the parent: logout was requested. */
  readonly logoutRequested = output<void>();

  /**
   * A click inside the menu can land on the item itself or on one of its children.
   * `closest` covers both cases with a single listener on the `<nav>`.
   */
  onNavigationClick(event: Event): void {
    if ((event.target as HTMLElement).closest('a, button, [role="button"]')) {
      this.navigated.emit();
    }
  }
}
