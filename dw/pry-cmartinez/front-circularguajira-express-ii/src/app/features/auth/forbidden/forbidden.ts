import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

/** Screen for a session without permission on the requested page (used by the ISS-09 guards). */
@Component({
  host: { class: 'block' },
  selector: 'app-forbidden',
  imports: [RouterLink, ButtonModule, CardModule],
  templateUrl: './forbidden.html',
  styleUrl: './forbidden.css',
})
export class Forbidden {}
