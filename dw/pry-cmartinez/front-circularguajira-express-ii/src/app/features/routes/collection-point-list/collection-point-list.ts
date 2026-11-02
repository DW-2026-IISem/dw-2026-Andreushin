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
import { CollectionPoint, CollectionPointPayload } from '../../../core/models/collection-point.model';
import { Route } from '../../../core/models/route.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { CollectionPointApi } from '../collection-point-api';
import { CollectionPointForm } from '../collection-point-form/collection-point-form';
import { RouteApi } from '../route-api';

/**
 * Collection points and their many-to-one relation with routes.
 *
 * Points and active routes load in parallel (`forkJoin`); the table only has `routeId`, so
 * the route name is resolved with a `Map` built once in a `computed`.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-collection-point-list',
  imports: [
    ButtonModule,
    CollectionPointForm,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './collection-point-list.html',
  styleUrl: './collection-point-list.css',
})
export class CollectionPointList {
  private readonly api = inject(CollectionPointApi);
  private readonly routesApi = inject(RouteApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  /** Active points, ordered by route and visit order by the backend. */
  readonly rows = signal<CollectionPoint[]>([]);
  /** Active routes: the only ones a point can be assigned to. */
  readonly routes = signal<Route[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  /**
   * `routeName()` returns a function: the `Map` is rebuilt only when `routes()` changes and
   * each row is resolved in O(1) instead of searching the array per row.
   */
  readonly routeName = computed(() => {
    const names = new Map(this.routes().map((route) => [route.id, route.name]));
    return (id: number) => names.get(id) ?? `Ruta #${id} (inactiva)`;
  });

  /** A point whose route is no longer active keeps its `routeId`, but the route left the list. */
  readonly routeIsActive = computed(() => {
    const ids = new Set(this.routes().map((route) => route.id));
    return (id: number) => ids.has(id);
  });

  /** Active routes that still have no active collection point. */
  readonly routesWithoutPoints = computed(() => {
    const used = new Set(this.rows().map((point) => point.routeId));
    return this.routes().filter((route) => !used.has(route.id)).length;
  });

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (point) => [point.name, point.address, this.routeName()(point.routeId)]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<CollectionPoint | null>(null);
  readonly resetKey = signal(0);

  readonly title = computed(() => (this.editing() ? 'Editar punto de recolección' : 'Nuevo punto de recolección'));

  constructor() {
    this.load();
  }

  /** Points and routes in parallel: one repaint and one error channel for both. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({ points: this.api.list(), routes: this.routesApi.list() }).subscribe({
      next: ({ points, routes }) => {
        this.rows.set(points);
        this.routes.set(routes);
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

  openEdit(point: CollectionPoint): void {
    this.editing.set(point);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  /** The backend checks that the route is active (400) and that the visit order is free (409). */
  save(payload: CollectionPointPayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Punto actualizado' : 'Punto creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  /** Logical delete: `PATCH /:id/deactivate`. The point stops being listed. */
  deactivate(point: CollectionPoint): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar el punto ${point.name}? Su estado pasará a inactivo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(point.id).subscribe({
          next: () => {
            this.notify.warn('Punto desactivado');
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
  remove(point: CollectionPoint): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará el punto ${point.name} de la base de datos. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(point.id).subscribe({
          next: () => {
            this.notify.success('Punto eliminado');
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
