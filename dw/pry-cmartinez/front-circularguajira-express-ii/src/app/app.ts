import { Component } from '@angular/core';
import { Example } from './demo/example/example';

/**
 * Root component (`<app-root>`).
 *
 * The first one Angular renders. In ISS-01 it only composes the example component,
 * so it shows up on screen through a tag. Routes arrive in ISS-01B, once there is a
 * business screen to show.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-root',
  imports: [Example],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
