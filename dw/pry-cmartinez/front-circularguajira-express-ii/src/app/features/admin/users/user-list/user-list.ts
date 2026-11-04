import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { EffectivePermission } from '../../../../core/models/auth.model';
import { RoleUser } from '../../../../core/models/role-user.model';
import { User, UserCreatePayload } from '../../../../core/models/user.model';
import { NotificationService } from '../../../../core/services/notification';
import { SessionStore } from '../../../../core/services/session-store';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { methodSeverity } from '../../../../core/utils/http-method';
import { readIf } from '../../../../core/utils/read-if';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { RoleUserApi } from '../../role-users/role-user-api';
import { UserApi } from '../user-api';
import { UserForm, UserFormPayload } from '../user-form/user-form';
import { archiveScope } from '../../../../core/utils/archive-scope';
import { RecordScopeFilter } from '../../../../shared/ui/record-scope-filter/record-scope-filter';

/**
 * Users of the system (`GET /api/users` lists the active ones, never the password).
 * «Ver permisos» shows what the backend would authorize for that user right now: the
 * fastest way to diagnose a 403. The session's own user cannot be deactivated or deleted.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-user-list',
  imports: [
    RecordScopeFilter,
    HasPermission,
    ButtonModule,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
    UserForm,
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  private readonly api = inject(UserApi);
  private readonly roleUsersApi = inject(RoleUserApi);
  private readonly session = inject(SessionStore);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly methodSeverity = methodSeverity;

  readonly rows = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  /** Inactive records, for sessions with the archive grant (ADMIN). */
  readonly archive = archiveScope<User>('users', 'users');

  readonly visibleRows = computed(() =>
    filterRows(this.archive.rows(this.rows()), this.filter(), (user) => [
      user.username,
      user.email,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<User | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? 'Editar usuario' : 'Nuevo usuario'));

  /** «Ver permisos» dialog. */
  readonly accessUser = signal<User | null>(null);
  readonly access = signal<EffectivePermission[]>([]);
  readonly accessRoles = signal<string[]>([]);
  readonly accessLoading = signal(false);

  constructor() {
    this.load();
  }

  /** Deactivating or deleting yourself would lock the administrator out. */
  isSelf(user: User): boolean {
    return this.session.user()?.id === user.id;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.archive.reload();
    this.api.list().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  openEdit(user: User): void {
    this.editing.set(user);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: UserFormPayload): void {
    const current = this.editing();
    this.saving.set(true);
    const request = current
      ? this.api.update(current.id, payload)
      : this.api.create(payload as UserCreatePayload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          current ? 'Usuario actualizado' : 'Usuario creado',
          current ? undefined : 'Asígnale un rol en «Asignaciones».',
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  /**
   * `GET /api/users/:id/permissions` (the same query `authorize` runs) and, if the session
   * may read them, the active role assignments of that user.
   */
  openPermissions(user: User): void {
    this.accessUser.set(user);
    this.access.set([]);
    this.accessRoles.set([]);
    this.accessLoading.set(true);
    forkJoin({
      permissions: this.api.permissions(user.id),
      assignments: readIf<RoleUser>(this.session.canPermission('GET /api/role-users'), () =>
        this.roleUsersApi.list(),
      ),
    }).subscribe({
      next: ({ permissions, assignments }) => {
        this.access.set(
          [...permissions].sort(
            (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
          ),
        );
        this.accessRoles.set(
          assignments
            .filter((row) => row.userId === user.id)
            .map((row) => row.role?.name ?? `Rol #${row.roleId}`),
        );
        this.accessLoading.set(false);
      },
      error: (error: unknown) => {
        this.accessLoading.set(false);
        this.notify.error('No se pudieron leer los permisos', toApiMessage(error));
      },
    });
  }

  closePermissions(): void {
    this.accessUser.set(null);
  }

  deactivate(user: User): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar a ${user.username}? No podrá iniciar sesión y sus tokens dejan de servir.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(user.id).subscribe({
          next: () => {
            this.notify.warn('Usuario desactivado');
            this.load();
          },
          error: (error: unknown) =>
            this.notify.error('No se pudo desactivar', toApiMessage(error)),
        }),
    });
  }

  remove(user: User): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará ${user.username} y sus asignaciones de rol. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(user.id).subscribe({
          next: () => {
            this.notify.success('Usuario eliminado');
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        }),
    });
  }
}
