import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Material, MaterialPayload } from '../../../core/models/material.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { MaterialApi } from '../material-api';
import { MaterialForm } from '../material-form/material-form';
import { HasPermission } from '../../../shared/directives/has-permission';

/**
 * Material catalog with every CRUD operation. Same structure as `RecyclerList`: only the
 * service, the model, the searchable fields and the form change.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-material-list',
  imports: [
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
    MaterialForm,
  ],
  templateUrl: './material-list.html',
  styleUrl: './material-list.css',
})
export class MaterialList {
  private readonly api = inject(MaterialApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  /** Backend data (`GET /api/materials` only returns `active`, ordered by name). */
  readonly rows = signal<Material[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (material) => [material.name, material.description]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Material | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() => (this.editing() ? 'Editar material' : 'Nuevo material'));

  constructor() {
    this.load();
  }

  /** `GET /api/materials`: reloads the table and clears the previous error. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);

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

  openEdit(material: Material): void {
    this.editing.set(material);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  /** One handler to create and edit: `editing()` chooses between POST and PATCH. */
  save(payload: MaterialPayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Material actualizado' : 'Material creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  /** Logical delete: `PATCH /:id/deactivate`. The material stops being listed. */
  deactivate(material: Material): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar el material ${material.name}? Su estado pasará a inactivo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(material.id).subscribe({
          next: () => {
            this.notify.warn('Material desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  /** Physical delete: `DELETE /:id`. The backend refuses it (409) if the material has rates or weighings. */
  remove(material: Material): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará el material ${material.name} de la base de datos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(material.id).subscribe({
          next: () => {
            this.notify.success('Material eliminado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo eliminar', toApiMessage(error));
          },
        });
      },
    });
  }
}
