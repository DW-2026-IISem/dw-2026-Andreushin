import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

/**
 * Where `permissionGuard` sends a session without the grant of a screen. It shows the
 * missing permission so an administrator knows which row of `resource_roles` to create.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-forbidden',
  imports: [RouterLink, ButtonModule, CardModule],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {
  readonly permission = inject(ActivatedRoute).snapshot.queryParamMap.get('permission');
}
