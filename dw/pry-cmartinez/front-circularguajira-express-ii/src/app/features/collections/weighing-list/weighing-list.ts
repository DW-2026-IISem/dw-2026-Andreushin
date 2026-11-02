import { CurrencyPipe, DecimalPipe } from '@angular/common';
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
import { Collection } from '../../../core/models/collection.model';
import { Material } from '../../../core/models/material.model';
import { Weighing, WeighingCreatePayload } from '../../../core/models/weighing.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { MaterialApi } from '../../materials/material-api';
import { CollectionApi } from '../collection-api';
import { WeighingApi } from '../weighing-api';
import { CollectionOption, WeighingForm } from '../weighing-form/weighing-form';

/**
 * Weighings as an independent CRUD of lines (equivalent to the sale lines of the guide).
 *
 * The normal flow registers a whole collection in one POST (ISS-06); this screen exists to
 * correct lines. Every write locks the collection (409 if it is settled) and Express
 * recalculates its totals in the same transaction.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-weighing-list',
  imports: [
    ButtonModule,
    CurrencyPipe,
    DecimalPipe,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    TableModule,
    TagModule,
    TooltipModule,
    WeighingForm,
  ],
  templateUrl: './weighing-list.html',
  styleUrl: './weighing-list.css',
})
export class WeighingList {
  private readonly api = inject(WeighingApi);
  private readonly collectionsApi = inject(CollectionApi);
  private readonly materialsApi = inject(MaterialApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Weighing[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly materials = signal<Material[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly materialName = computed(() => {
    const names = new Map(this.materials().map((material) => [material.id, material.name]));
    return (id: number) => names.get(id) ?? `Material #${id}`;
  });

  readonly collectionLabel = computed(() => {
    const labels = new Map(this.collections().map((collection) => [collection.id, `#${collection.id} · ${collection.collectedOn}`]));
    return (id: number) => labels.get(id) ?? `#${id}`;
  });

  readonly collectionOptions = computed<CollectionOption[]>(() =>
    this.collections().map((collection) => ({ id: collection.id, label: `#${collection.id} · ${collection.collectedOn}` })),
  );

  readonly visibleRows = computed(() =>
    filterRows(this.rows(), this.filter(), (weighing) => [
      this.collectionLabel()(weighing.collectionId),
      this.materialName()(weighing.materialId),
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Weighing | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() => (this.editing() ? `Editar pesaje #${this.editing()?.id}` : 'Nuevo pesaje'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      weighings: this.api.list(),
      collections: this.collectionsApi.list(),
      materials: this.materialsApi.list(),
    }).subscribe({
      next: ({ weighings, collections, materials }) => {
        this.rows.set(weighings);
        this.collections.set(collections);
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

  openCreate(): void {
    this.editing.set(null);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  openEdit(weighing: Weighing): void {
    this.editing.set(weighing);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  /** Create sends the whole line; edit sends only gross and tare. */
  save(value: WeighingCreatePayload): void {
    const current = this.editing();
    this.saving.set(true);

    const request = current
      ? this.api.update(current.id, { grossKg: value.grossKg, tareKg: value.tareKg })
      : this.api.create(value);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Pesaje actualizado' : 'Pesaje agregado', 'Totales de la recolección recalculados.');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(weighing: Weighing): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar el pesaje #${weighing.id}? Los totales de la recolección se recalculan.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.deactivate(weighing.id).subscribe({
          next: () => {
            this.notify.warn(`Pesaje #${weighing.id} desactivado`);
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo desactivar', toApiMessage(error)),
        });
      },
    });
  }

  remove(weighing: Weighing): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará el pesaje #${weighing.id}. Esta acción no se puede deshacer.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.api.remove(weighing.id).subscribe({
          next: () => {
            this.notify.success(`Pesaje #${weighing.id} eliminado`);
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        });
      },
    });
  }
}
