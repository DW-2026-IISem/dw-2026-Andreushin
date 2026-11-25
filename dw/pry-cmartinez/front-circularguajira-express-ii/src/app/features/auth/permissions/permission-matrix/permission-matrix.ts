import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { Resource } from '../../../../core/models/resource.model';
import { Role } from '../../../../core/models/role.model';
import { NotificationService } from '../../../../core/services/notification';
import { SessionStore } from '../../../../core/services/session-store';
import { toApiMessage } from '../../../../core/utils/api-error';
import {
  CRUD_COLUMNS,
  CellState,
  CrudColumn,
  buildPermissionMatrix,
  cellState,
  diffSelection,
  toggleCell,
} from '../../../../core/utils/permission-matrix';
import { isRbacAdminPath } from '../../../../core/utils/rbac-lockout';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { ResourceApi } from '../../resources/crud/resource-api';
import { RoleApi } from '../../roles/crud/role-api';
import { ResourceRoleApi } from '../../resource-roles/crud/resource-role-api';

/** One checkbox of the matrix: the resources it groups and how they are selected. */
interface MatrixCell {
  column: CrudColumn;
  resources: Resource[];
  state: CellState;
  selected: number;
  /** Every resource of the cell is protected: the administrator cannot give it up. */
  locked: boolean;
  title: string;
}

interface MatrixRow {
  entity: string;
  label: string;
  cells: MatrixCell[];
}

/**
 * «Roles y permisos»: the grants of ONE role as an entity × C/R/U/D table. It only edits
 * `resource_roles`; Express still authorizes every request, so a checked box here is
 * administration, not security. The whole selection travels in a single request
 * (`POST /api/resource-roles/reconcile` with `roleId` + `resourceIds`), never one call per box.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-permission-matrix',
  imports: [
    HasPermission,
    ButtonModule,
    EmptyState,
    FormsModule,
    MessageModule,
    PageHeader,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './permission-matrix.html',
})
export class PermissionMatrix {
  private readonly api = inject(ResourceRoleApi);
  private readonly rolesApi = inject(RoleApi);
  private readonly resourcesApi = inject(ResourceApi);
  private readonly session = inject(SessionStore);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly columns = CRUD_COLUMNS;

  readonly roles = signal<Role[]>([]);
  readonly resources = signal<Resource[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  /** Resource ids the role holds in the backend (last read). */
  readonly savedIds = signal<ReadonlySet<number>>(new Set());
  /** Resource ids currently checked: this exact set is what gets saved. */
  readonly selectedIds = signal<ReadonlySet<number>>(new Set());

  readonly loading = signal(true);
  readonly loadingGrants = signal(false);
  /** False until the grants of the chosen role arrived: never paint (or save) a guessed matrix. */
  readonly grantsLoaded = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveMessage = signal<string | null>(null);

  readonly busy = computed(() => this.loading() || this.loadingGrants() || this.saving());

  /**
   * Grants the session cannot give up: if you hold the role being edited, the RBAC administration
   * endpoints it already has stay checked, otherwise the screens that restore access would vanish.
   */
  readonly lockedIds = computed<ReadonlySet<number>>(() => {
    const role = this.selectedRole();
    if (!role || !this.session.hasRole(role.name)) {
      return new Set();
    }
    return new Set(
      this.resources()
        .filter((resource) => isRbacAdminPath(resource.path) && this.savedIds().has(resource.id))
        .map((resource) => resource.id),
    );
  });

  readonly changes = computed(() => diffSelection(this.savedIds(), this.selectedIds()));
  readonly dirty = computed(
    () => this.changes().added.length > 0 || this.changes().removed.length > 0,
  );
  readonly canSave = computed(
    () => this.selectedRole() !== null && this.grantsLoaded() && this.dirty() && !this.busy(),
  );

  readonly rows = computed<MatrixRow[]>(() => {
    const selected = this.selectedIds();
    const locked = this.lockedIds();
    return buildPermissionMatrix(this.resources()).map((row) => ({
      entity: row.entity,
      label: row.label,
      cells: this.columns.map((column) => {
        const resources = row.operations[column.key];
        const isLocked = resources.length > 0 && resources.every((r) => locked.has(r.id));
        return {
          column,
          resources,
          state: cellState(resources, selected),
          selected: resources.filter((resource) => selected.has(resource.id)).length,
          locked: isLocked,
          title:
            resources.map((resource) => `${resource.method} ${resource.path}`).join('\n') +
            (isLocked ? '\nProtegido: tu sesión depende de este rol' : ''),
        };
      }),
    }));
  });

  /** The session holds the role being edited: its menu changes after «Actualizar permisos». */
  readonly editingOwnRole = computed(() => {
    const role = this.selectedRole();
    return role !== null && this.session.hasRole(role.name);
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ roles: this.rolesApi.list(), resources: this.resourcesApi.list() }).subscribe({
      next: ({ roles, resources }) => {
        this.roles.set(roles);
        this.resources.set(resources);
        this.loading.set(false);
        const current = this.selectedRole();
        this.selectRole(roles.find((role) => role.id === current?.id) ?? roles[0] ?? null);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  /** Changing role drops the previous matrix first: no stale boxes while the new one loads. */
  selectRole(role: Role | null): void {
    this.selectedRole.set(role);
    this.saveMessage.set(null);
    this.error.set(null);
    this.grantsLoaded.set(false);
    this.savedIds.set(new Set());
    this.selectedIds.set(new Set());
    if (role) {
      this.loadGrants(role);
    }
  }

  loadGrants(role: Role): void {
    this.loadingGrants.set(true);
    this.api.list({ roleId: role.id }).subscribe({
      next: (grants) => {
        if (this.selectedRole()?.id !== role.id) {
          return; // the administrator already moved to another role
        }
        // A grant on a resource that is no longer in the active catalog cannot be sent back.
        const known = new Set(this.resources().map((resource) => resource.id));
        const ids = new Set(grants.map((grant) => grant.resourceId).filter((id) => known.has(id)));
        this.savedIds.set(ids);
        this.selectedIds.set(new Set(ids));
        this.grantsLoaded.set(true);
        this.loadingGrants.set(false);
      },
      error: (error: unknown) => {
        if (this.selectedRole()?.id !== role.id) {
          return;
        }
        this.error.set(toApiMessage(error));
        this.loadingGrants.set(false);
      },
    });
  }

  toggle(cell: MatrixCell, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.busy() || !this.grantsLoaded()) {
      input.checked = cell.state === 'checked';
      return;
    }
    this.saveMessage.set(null);
    const next = toggleCell(this.selectedIds(), cell.resources, input.checked, this.lockedIds());
    this.selectedIds.set(next);
    // A protected id may have survived the uncheck: put the native box back in sync.
    const state = cellState(cell.resources, next);
    input.checked = state === 'checked';
    input.indeterminate = state === 'partial';
  }

  /** Grants everything in the catalog, RBAC administration included: it asks first. */
  selectAll(): void {
    this.confirmation.confirm({
      header: 'Marcar todo',
      message: `Se marcarán los ${this.resources().length} recursos del catálogo, incluidos los de administración de usuarios, roles y permisos. ¿Continuar?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Marcar todo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.saveMessage.set(null);
        this.selectedIds.set(new Set(this.resources().map((resource) => resource.id)));
      },
    });
  }

  clearAll(): void {
    this.saveMessage.set(null);
    this.selectedIds.set(new Set(this.lockedIds()));
  }

  save(): void {
    const role = this.selectedRole();
    if (!role || !this.canSave()) {
      return; // also blocks a double submit while the request is pending
    }
    this.saving.set(true);
    this.error.set(null);
    this.saveMessage.set(null);
    const resourceIds = [...this.selectedIds()].sort((a, b) => a - b);
    this.api.reconcile(role.id, resourceIds).subscribe({
      next: (result) => {
        this.saving.set(false);
        // Success is announced only now: the server answered.
        const message = `Cambios guardados. ${result.totalActive} permisos activos para ${role.name}.`;
        this.saveMessage.set(message);
        this.notify.success('Permisos guardados', message);
        this.loadGrants(role);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(toApiMessage(error));
      },
    });
  }
}
