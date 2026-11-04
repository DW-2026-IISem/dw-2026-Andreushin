import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Role } from '../../../../core/models/role.model';
import { RoleUser } from '../../../../core/models/role-user.model';
import { User } from '../../../../core/models/user.model';
import { NotificationService } from '../../../../core/services/notification';
import { SessionStore } from '../../../../core/services/session-store';
import { toApiMessage } from '../../../../core/utils/api-error';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { RoleApi } from '../../roles/role-api';
import { UserApi } from '../../users/user-api';
import { RoleUserApi } from '../role-user-api';
import { archiveScope } from '../../../../core/utils/archive-scope';
import { RecordScopeFilter } from '../../../../shared/ui/record-scope-filter/record-scope-filter';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';

/**
 * User ↔ role assignments (`role_users`). There is no physical delete: «Retirar» is the
 * logical delete and assigning an inactive pair again reactivates it (200 instead of 201).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-role-user-list',
  imports: [
    RecordScopeFilter,
    StatusTag,
    HasPermission,
    ButtonModule,
    DatePipe,
    DialogModule,
    EmptyState,
    FormsModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './role-user-list.html',
  styleUrl: './role-user-list.css',
})
export class RoleUserList {
  private readonly api = inject(RoleUserApi);
  private readonly usersApi = inject(UserApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly session = inject(SessionStore);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<RoleUser[]>([]);
  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly userFilter = signal<User | null>(null);
  readonly roleFilter = signal<Role | null>(null);

  /** Inactive records, for sessions with the archive grant (ADMIN). */
  readonly archive = archiveScope<RoleUser>('role-users', 'assignments');

  readonly visibleRows = computed(() => {
    const user = this.userFilter();
    const role = this.roleFilter();
    return this.archive
      .rows(this.rows())
      .filter((row) => (!user || row.userId === user.id) && (!role || row.roleId === role.id));
  });

  readonly dialogVisible = signal(false);
  readonly selectedUser = signal<User | null>(null);
  readonly selectedRole = signal<Role | null>(null);

  /** The pair is already active: the backend would answer 409. */
  readonly alreadyAssigned = computed(() => {
    const user = this.selectedUser();
    const role = this.selectedRole();
    return Boolean(
      user && role && this.rows().some((row) => row.userId === user.id && row.roleId === role.id),
    );
  });

  readonly canSave = computed(
    () => Boolean(this.selectedUser() && this.selectedRole()) && !this.alreadyAssigned(),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.archive.reload();
    forkJoin({
      rows: this.api.list(),
      users: this.usersApi.list(),
      roles: this.rolesApi.list(),
    }).subscribe({
      next: ({ rows, users, roles }) => {
        this.rows.set(rows);
        this.users.set(users);
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  /** Removing your own role could leave nobody able to administer the RBAC. */
  isSelf(row: RoleUser): boolean {
    return this.session.user()?.id === row.userId;
  }

  openAssign(): void {
    this.selectedUser.set(this.userFilter());
    this.selectedRole.set(this.roleFilter());
    this.dialogVisible.set(true);
  }

  assign(): void {
    const user = this.selectedUser();
    const role = this.selectedRole();
    if (!user || !role || !this.canSave()) {
      return;
    }
    this.saving.set(true);
    this.api.create({ userId: user.id, roleId: role.id }).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          'Rol asignado',
          `${user.username} ahora tiene ${role.name}. Debe pulsar «Actualizar permisos» o volver a entrar.`,
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo asignar', toApiMessage(error));
      },
    });
  }

  retire(row: RoleUser): void {
    const username = row.user?.username ?? `#${row.userId}`;
    const roleName = row.role?.name ?? `#${row.roleId}`;
    this.confirmation.confirm({
      header: 'Retirar rol',
      message: `¿Retirar ${roleName} a ${username}? Pierde de inmediato los permisos de ese rol.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar retiro',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(row.id).subscribe({
          next: () => {
            this.notify.warn('Rol retirado', `${username} ya no tiene ${roleName}.`);
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo retirar', toApiMessage(error)),
        }),
    });
  }
}
