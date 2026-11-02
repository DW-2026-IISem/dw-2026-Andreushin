import { Component } from '@angular/core';

/**
 * Application side menu.
 *
 * ISS-01A: only the container. In ISS-01B it receives `items` through `input()` and
 * renders `p-panelmenu`. It knows nothing about routes or permissions: that arrives in
 * ISS-02/ISS-08.
 */
@Component({
  host: { class: 'block h-full' },
  selector: 'app-aside',
  templateUrl: './aside.html',
  styleUrl: './aside.css',
})
export class Aside {}
