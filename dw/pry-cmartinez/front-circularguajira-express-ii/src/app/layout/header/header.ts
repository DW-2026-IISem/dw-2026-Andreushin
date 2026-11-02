import { Component, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';

/**
 * Application top bar.
 *
 * Pure presentation: receives data through `input()` and notifies the parent with
 * `output()`. It injects no services, does not call the API and knows no permissions.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-header',
  imports: [AvatarModule, ButtonModule, MenuModule, TagModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  /** Visible application name. */
  readonly appName = input('CircularGuajira Express II');

  /** Session data with defaults: ISS-08 fills them in. */
  readonly username = input('');
  readonly initials = input('IN');
  readonly roleLabel = input('Sin rol');
  readonly authEnabled = input(true);
  readonly showSession = input(false);
  readonly userItems = input<MenuItem[]>([]);

  /** Notice to the parent: the menu button was pressed (the parent decides what it does). */
  readonly menuRequested = output<void>();
}
