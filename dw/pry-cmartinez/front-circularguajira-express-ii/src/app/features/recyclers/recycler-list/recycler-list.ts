import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Recycler, RecyclerPayload, RecyclerType } from '../../../core/models/recycler.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { RecyclerApi } from '../recycler-api';
import { RecyclerForm } from '../recycler-form/recycler-form';

/**
 * Recycler list with every CRUD operation.
 *
 * All the state lives in signals: the table and the counters repaint on their own and
 * `visibleRows` is recalculated only when `rows()` or `filter()` change.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-recycler-list',
  imports: [
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
    RecyclerForm,
  ],
  templateUrl: './recycler-list.html',
  styleUrl: './recycler-list.css',
})
export class RecyclerList {
  private readonly api = inject(RecyclerApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  /** Backend data (`GET /api/recyclers` only returns `active`). */
  readonly rows = signal<Recycler[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  /** Result of applying the search box; `computed` memoizes it. */
  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (recycler) => [
      recycler.name,
      recycler.documentNumber,
      recycler.phone,
      recycler.email,
      recycler.address,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Recycler | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() => (this.editing() ? 'Editar reciclador' : 'Nuevo reciclador'));

  private readonly typeLabels: Record<RecyclerType, string> = {
    independent: 'Independiente',
    organization: 'Organización',
  };

  constructor() {
    this.load();
  }

  typeLabel(type: RecyclerType): string {
    return this.typeLabels[type];
  }

  /** `GET /api/recyclers`: reloads the table and clears the previous error. */
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

  openEdit(recycler: Recycler): void {
    this.editing.set(recycler);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  /**
   * One handler to create and edit: `editing()` chooses the verb. On success the dialog
   * closes and the table reloads (the backend is the truth).
   */
  save(payload: RecyclerPayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Reciclador actualizado' : 'Reciclador creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  /** Logical delete: `PATCH /:id/deactivate`. The record stops being listed. */
  deactivate(recycler: Recycler): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar a ${recycler.name}? Su estado pasará a inactivo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(recycler.id).subscribe({
          next: () => {
            this.notify.warn('Reciclador desactivado');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  /** Physical delete: `DELETE /:id`. It cannot be undone. */
  remove(recycler: Recycler): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará ${recycler.name} de la base de datos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(recycler.id).subscribe({
          next: () => {
            this.notify.success('Reciclador eliminado');
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
