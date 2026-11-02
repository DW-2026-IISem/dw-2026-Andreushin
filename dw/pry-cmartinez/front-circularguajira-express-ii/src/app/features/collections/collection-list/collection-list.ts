import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { toNumber } from '../../../core/models/api.model';
import { Collection } from '../../../core/models/collection.model';
import { Material } from '../../../core/models/material.model';
import { Recycler } from '../../../core/models/recycler.model';
import { Route } from '../../../core/models/route.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { round2 } from '../../../core/utils/weighing-math';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';
import { MaterialApi } from '../../materials/material-api';
import { RecyclerApi } from '../../recyclers/recycler-api';
import { RouteApi } from '../../routes/route-api';
import { CollectionApi } from '../collection-api';
import { CollectionDetail } from '../collection-detail/collection-detail';

/**
 * Collections (header + weighings). Names of recycler and route are resolved with `Map`s;
 * the totals are the ones Express stored, never recalculated here.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-collection-list',
  imports: [
    ButtonModule,
    CollectionDetail,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    RouterLink,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './collection-list.html',
  styleUrl: './collection-list.css',
})
export class CollectionList {
  private readonly api = inject(CollectionApi);
  private readonly recyclersApi = inject(RecyclerApi);
  private readonly routesApi = inject(RouteApi);
  private readonly materialsApi = inject(MaterialApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Collection[]>([]);
  readonly recyclers = signal<Recycler[]>([]);
  readonly routes = signal<Route[]>([]);
  readonly materials = signal<Material[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly recyclerName = computed(() => {
    const names = new Map(this.recyclers().map((recycler) => [recycler.id, recycler.name]));
    return (id: number) => names.get(id) ?? `Reciclador #${id}`;
  });

  readonly routeName = computed(() => {
    const names = new Map(this.routes().map((route) => [route.id, route.name]));
    return (id: number) => names.get(id) ?? `Ruta #${id}`;
  });

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (collection) => [
      collection.id,
      collection.collectedOn,
      this.recyclerName()(collection.recyclerId),
      this.routeName()(collection.routeId),
    ]),
  );

  /** Collection shown in the detail dialog (already loaded with its weighings). */
  readonly selected = signal<Collection | null>(null);
  readonly detailVisible = signal(false);
  readonly detailTitle = computed(() => `Recolección #${this.selected()?.id ?? ''}`);

  /** Sum of the stored totals of the active collections. */
  readonly totalAmount = computed(() => round2(this.rows().reduce((sum, row) => sum + toNumber(row.totalAmount), 0)));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      collections: this.api.list(),
      recyclers: this.recyclersApi.list(),
      routes: this.routesApi.list(),
      materials: this.materialsApi.list(),
    }).subscribe({
      next: ({ collections, recyclers, routes, materials }) => {
        this.rows.set(collections);
        this.recyclers.set(recyclers);
        this.routes.set(routes);
        this.materials.set(materials);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rows.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  openDetail(collection: Collection): void {
    this.selected.set(collection);
    this.detailVisible.set(true);
  }

  weighingCount(collection: Collection): number {
    return collection.weighings?.length ?? 0;
  }

  /** Logical delete: the collection and its weighings become inactive (409 if settled). */
  deactivate(collection: Collection): void {
    this.confirmation.confirm({
      header: 'Cancelar recolección',
      message: `¿Cancelar la recolección #${collection.id}? Ella y sus pesajes pasarán a inactivos.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar cancelación',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(collection.id).subscribe({
          next: () => {
            this.notify.warn(`Recolección #${collection.id} cancelada`);
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo cancelar', toApiMessage(error)),
        });
      },
    });
  }

  /** Physical delete: weighings and header, never once a settlement references it (409). */
  remove(collection: Collection): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará la recolección #${collection.id} con sus pesajes. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(collection.id).subscribe({
          next: () => {
            this.notify.success(`Recolección #${collection.id} eliminada`);
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        });
      },
    });
  }
}
