import { Component, computed, inject, signal } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Route, RoutePayload } from '../../../core/models/route.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { RouteApi } from '../route-api';
import { RouteForm } from '../route-form/route-form';
import { HasPermission } from '../../../shared/directives/has-permission';
import { archiveScope } from '../../../core/utils/archive-scope';
import { RecordScopeFilter } from '../../../shared/ui/record-scope-filter/record-scope-filter';

/**
 * Collection routes with every CRUD operation (same structure as `RouteList`). A route
 * with collection points cannot be deleted (409): deactivate it instead.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-route-list',
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
    RouteForm,
  ],
  templateUrl: './route-list.html',
  styleUrl: './route-list.css',
})
export class RouteList {
  private readonly api = inject(RouteApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  /** Backend data (`GET /api/routes` only returns `active`, ordered by name). */
  readonly rows = signal<Route[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  /** Inactive records, for sessions with the archive grant (ADMIN). */
  readonly archive = archiveScope<Route>('routes', 'routes');

  readonly visibleRows = computed(() =>
    filterRows(this.archive.rows(this.rows()), this.filter(), (route) => [
      route.name,
      route.municipality,
      route.description,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Route | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() => (this.editing() ? 'Editar ruta' : 'Nueva ruta'));

  constructor() {
    this.load();
  }

  /** `GET /api/routes`: reloads the table and clears the previous error. */
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

  openEdit(route: Route): void {
    this.editing.set(route);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  /** One handler to create and edit: `editing()` chooses between POST and PATCH. */
  save(payload: RoutePayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Ruta actualizada' : 'Ruta creada');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  /** Logical delete: `PATCH /:id/deactivate`. The route stops being listed. */
  deactivate(route: Route): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar la ruta ${route.name}? Sus puntos ya no se podrán asignar a nuevas recolecciones.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(route.id).subscribe({
          next: () => {
            this.notify.warn('Ruta desactivada');
            this.load();
          },
          error: (error: unknown) => {
            this.notify.error('No se pudo desactivar', toApiMessage(error));
          },
        });
      },
    });
  }

  /** Physical delete: `DELETE /:id`. The backend refuses it (409) while the route has collection points. */
  remove(route: Route): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará la ruta ${route.name} de la base de datos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(route.id).subscribe({
          next: () => {
            this.notify.success('Ruta eliminada');
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
