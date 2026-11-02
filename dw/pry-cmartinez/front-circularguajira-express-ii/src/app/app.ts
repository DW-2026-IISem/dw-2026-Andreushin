import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root component (`<app-root>`).
 *
 * Since ISS-01B it is only the entry point: the router chooses which component is
 * drawn inside `<router-outlet />` according to the URL.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
