import { Component } from '@angular/core';

/**
 * Application footer.
 *
 * Pure presentation: no state and no services.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {}
