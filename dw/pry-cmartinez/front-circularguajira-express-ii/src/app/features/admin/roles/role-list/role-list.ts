import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import { Role, RolePayload } from '../../../../core/models/role.model';
import { RoleApi } from '../role-api';
import { RoleForm } from '../role-form/role-form';
import { archiveScope } from '../../../../core/utils/archive-scope';
import { RecordScopeFilter } from '../../../../shared/ui/record-scope-filter/record-scope-filter';

/**
 * Roles (`GET /api/roles` lists the active ones). A role authorizes nothing by itself:
 * what it can do are its grants («Concesiones») and who has it, its assignments.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-role-list',
  imports: [
    RecordScopeFilter,
    HasPermission,
    ButtonModule,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    RoleForm,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './role-list.html',
  styleUrl: './role-list.css',
})
export class RoleList {
  private readonly api = inject(RoleApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Role[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly dialogVisible = signal(false);
  readonly editing = signal<Role | null>(null);
  readonly resetKey = signal(0);

  /** Inactive records, for sessions with the archive grant (ADMIN). */
  readonly archive = archiveScope<Role>('roles', 'roles');

  readonly visibleRows = computed(() =>
    filterRows(this.archive.rows(this.rows()), this.filter(), (role) => [
      role.name,
      role.description,
    ]),
  );
  readonly title = computed(() => (this.editing() ? 'Editar rol' : 'Nuevo rol'));

  constructor() {
    this.load();
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

  openEdit(row: Role): void {
    this.editing.set(row);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: RolePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Rol actualizado' : 'Rol creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(row: Role): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar ${row.name}? Sus usuarios pierden de inmediato los permisos que les daba.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(row.id).subscribe({
          next: () => {
            this.notify.warn('Rol desactivado');
            this.load();
          },
          error: (error: unknown) =>
            this.notify.error('No se pudo desactivar', toApiMessage(error)),
        }),
    });
  }

  remove(row: Role): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará ${row.name}. Sus asignaciones y concesiones quedan sin rol.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(row.id).subscribe({
          next: () => {
            this.notify.success('Rol eliminado');
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        }),
    });
  }
}
