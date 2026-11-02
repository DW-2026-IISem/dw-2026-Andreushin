import { Component } from '@angular/core';
import { Aside } from './layout/aside/aside';
import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';

/**
 * Root component (`<app-root>`).
 *
 * The first one Angular renders. It composes the four screen regions: Header on top,
 * Aside on the left, the content in the middle and Footer at the bottom. The content is
 * still fixed; in ISS-01B it changes with the menu and in ISS-02 the router arrives.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-root',
  imports: [Header, Aside, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** Title of the initial screen. In ISS-01B it changes when a menu item is chosen. */
  protected readonly title = 'Inicio';
}
