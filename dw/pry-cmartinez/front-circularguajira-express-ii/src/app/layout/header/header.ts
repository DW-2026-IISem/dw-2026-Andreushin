import { Component } from '@angular/core';

/**
 * Application top bar.
 *
 * ISS-01A: only shows the name. In ISS-01B it receives data through `input()`, emits
 * `menuRequested` and adds the user menu. It does not call the API.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly title = 'CircularGuajira Express II';
}
