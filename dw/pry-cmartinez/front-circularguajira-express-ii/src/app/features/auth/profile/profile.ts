import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { SessionStore } from '../../../core/services/session-store';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

/** Who I am: profile, roles and effective permissions, with "Actualizar" and "Cerrar sesión". */
@Component({
  host: { class: 'block' },
  selector: 'app-profile',
  imports: [ButtonModule, CardModule, TableModule, TagModule, PageHeader],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  readonly session = inject(SessionStore);

  readonly refreshing = signal(false);

  /** Permissions ordered by path and method, as the backend catalog reads. */
  readonly permissions = computed(() =>
    [...this.session.permissions()].sort(
      (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
    ),
  );

  readonly methodSeverity: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warn',
    PATCH: 'warn',
    DELETE: 'danger',
  };

  /** `GET /api/session/profile` + `GET /api/session/permissions` again. */
  refresh(): void {
    this.refreshing.set(true);
    this.auth.me().subscribe({
      next: () => {
        this.refreshing.set(false);
        this.notify.success('Sesión sincronizada', 'Perfil y permisos recargados.');
      },
      error: () => this.refreshing.set(false),
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => {
        this.notify.info('Sesión cerrada');
        void this.router.navigate(['/login']);
      },
    });
  }
}
