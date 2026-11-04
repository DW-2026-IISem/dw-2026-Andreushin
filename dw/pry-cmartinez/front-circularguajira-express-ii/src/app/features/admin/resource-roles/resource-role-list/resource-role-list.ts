import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { Resource } from '../../../../core/models/resource.model';
import { ResourceRole } from '../../../../core/models/resource-role.model';
import { Role } from '../../../../core/models/role.model';
import { NotificationService } from '../../../../core/services/notification';
import { SessionStore } from '../../../../core/services/session-store';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { methodSeverity } from '../../../../core/utils/http-method';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { ResourceApi } from '../../resources/resource-api';
import { RoleApi } from '../../roles/role-api';
import { ResourceRoleApi } from '../resource-role-api';
import { archiveScope } from '../../../../core/utils/archive-scope';
import { RecordScopeFilter } from '../../../../shared/ui/record-scope-filter/record-scope-filter';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';

/** RBAC administration endpoints: revoking them from your own role would lock you out. */
const ADMIN_PATH = /^\/api\/(users|roles|resources|role-users|resource-roles)(\/|$)/;

/**
 * Role ↔ resource grants (`resource_roles`): each active row IS a permission. Granting a
 * resource takes effect on the next request (the backend reads the matrix every time);
 * the affected user sees it in the UI after «Actualizar permisos».
 */
@Component({
  host: { class: 'block' },
  selector: 'app-resource-role-list',
  imports: [
    RecordScopeFilter,
    StatusTag,
    HasPermission,
    ButtonModule,
    DialogModule,
    EmptyState,
    FormsModule,
    InputTextModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './resource-role-list.html',
  styleUrl: './resource-role-list.css',
})
export class ResourceRoleList {
  private readonly api = inject(ResourceRoleApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly resourcesApi = inject(ResourceApi);
  private readonly session = inject(SessionStore);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly methodSeverity = methodSeverity;

  readonly rows = signal<ResourceRole[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly roleFilter = signal<Role | null>(null);
  readonly filter = signal('');

  /** Active grants per role, for the header counters. */
  readonly countsByRole = computed(() =>
    this.roles().map((role) => ({
      name: role.name,
      count: this.rows().filter((row) => row.roleId === role.id).length,
    })),
  );

  /** Inactive records, for sessions with the archive grant (ADMIN). */
  readonly archive = archiveScope<ResourceRole>('resource-roles', 'grants');

  readonly visibleRows = computed(() => {
    const role = this.roleFilter();
    const byRole = role
      ? this.archive.rows(this.rows()).filter((row) => row.roleId === role.id)
      : this.archive.rows(this.rows());
    return filterRows(byRole, this.filter(), (row) => [
      row.resource?.path,
      row.resource?.method,
      row.role?.name,
      row.resource?.description,
    ]);
  });

  readonly dialogVisible = signal(false);
  readonly selectedRole = signal<Role | null>(null);
  readonly selectedResource = signal<Resource | null>(null);

  readonly alreadyGranted = computed(() => {
    const role = this.selectedRole();
    const resource = this.selectedResource();
    return Boolean(
      role &&
      resource &&
      this.rows().some((row) => row.roleId === role.id && row.resourceId === resource.id),
    );
  });

  readonly canSave = computed(
    () => Boolean(this.selectedRole() && this.selectedResource()) && !this.alreadyGranted(),
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
      roles: this.rolesApi.list(),
      resources: this.resourcesApi.list(),
    }).subscribe({
      next: ({ rows, roles, resources }) => {
        this.rows.set(rows);
        this.roles.set(roles);
        this.resources.set(resources);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  /** A grant of one of the session roles that administers the RBAC itself. */
  isLockout(row: ResourceRole): boolean {
    return this.session.hasRole(row.role?.name ?? '') && ADMIN_PATH.test(row.resource?.path ?? '');
  }

  openGrant(): void {
    this.selectedRole.set(this.roleFilter());
    this.selectedResource.set(null);
    this.dialogVisible.set(true);
  }

  grant(): void {
    const role = this.selectedRole();
    const resource = this.selectedResource();
    if (!role || !resource || !this.canSave()) {
      return;
    }
    this.saving.set(true);
    this.api.create({ roleId: role.id, resourceId: resource.id }).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          'Permiso concedido',
          `${role.name} puede ${resource.method} ${resource.path}.`,
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo conceder', toApiMessage(error));
      },
    });
  }

  revoke(row: ResourceRole): void {
    const label = `${row.resource?.method ?? ''} ${row.resource?.path ?? '#' + row.resourceId}`;
    const roleName = row.role?.name ?? `#${row.roleId}`;
    this.confirmation.confirm({
      header: 'Retirar permiso',
      message: `¿Retirar ${label} a ${roleName}? Sus usuarios recibirán 403 desde la siguiente petición.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar retiro',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(row.id).subscribe({
          next: () => {
            this.notify.warn('Permiso retirado', `${roleName} ya no puede ${label}.`);
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo retirar', toApiMessage(error)),
        }),
    });
  }
}
