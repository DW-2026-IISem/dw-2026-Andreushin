import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
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
import { toNumber } from '../../../core/models/api.model';
import { Collection } from '../../../core/models/collection.model';
import { Material } from '../../../core/models/material.model';
import { Recycler } from '../../../core/models/recycler.model';
import {
  Settlement,
  SettlementCreatePayload,
  SettlementVerification as Verification,
} from '../../../core/models/settlement.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { filterRows } from '../../../core/utils/filter-rows';
import { round2 } from '../../../core/utils/weighing-math';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { CollectionApi } from '../../collections/collection-api';
import { MaterialApi } from '../../materials/material-api';
import { RecyclerApi } from '../../recyclers/recycler-api';
import { SettlementApi } from '../settlement-api';
import { PendingCollectionOption, SettlementForm } from '../settlement-form/settlement-form';
import { SettlementVerification } from '../settlement-verification/settlement-verification';
import { HasPermission } from '../../../shared/directives/has-permission';
import { SessionStore } from '../../../core/services/session-store';
import { readIf } from '../../../core/utils/read-if';
import { archiveScope } from '../../../core/utils/archive-scope';
import { RecordScopeFilter } from '../../../shared/ui/record-scope-filter/record-scope-filter';

/**
 * Settlements: what is paid to each recycler for one collection.
 *
 * The backend lists only ISSUED settlements; settling freezes the totals, notes are the only
 * editable field, voiding keeps the history and reopens the collection, and the verification
 * recalculates every line against the rate of the collection date.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-settlement-list',
  imports: [
    RecordScopeFilter,
    HasPermission,
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    DialogModule,
    EmptyState,
    InputTextModule,
    MessageModule,
    PageHeader,
    SettlementForm,
    SettlementVerification,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './settlement-list.html',
  styleUrl: './settlement-list.css',
})
export class SettlementList {
  private readonly api = inject(SettlementApi);
  private readonly session = inject(SessionStore);
  private readonly collectionsApi = inject(CollectionApi);
  private readonly recyclersApi = inject(RecyclerApi);
  private readonly materialsApi = inject(MaterialApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly rows = signal<Settlement[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly recyclers = signal<Recycler[]>([]);
  readonly materials = signal<Material[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');

  readonly recyclerName = computed(() => {
    const names = new Map(this.recyclers().map((recycler) => [recycler.id, recycler.name]));
    return (id: number) => names.get(id) ?? `Reciclador #${id}`;
  });

  /** Active collections without an issued settlement: the only ones that can be settled. */
  readonly pending = computed(() => {
    const settled = new Set(this.rows().map((settlement) => settlement.collectionId));
    return this.collections().filter((collection) => !settled.has(collection.id));
  });

  readonly pendingOptions = computed<PendingCollectionOption[]>(() =>
    this.pending().map((collection) => ({
      id: collection.id,
      label: `#${collection.id} · ${collection.collectedOn} · ${this.recyclerName()(collection.recyclerId)}`,
    })),
  );

  readonly settledAmount = computed(() =>
    round2(this.rows().reduce((sum, row) => sum + toNumber(row.totalAmount), 0)),
  );

  /** Inactive records, for sessions with the archive grant (ADMIN). */
  readonly archive = archiveScope<Settlement>('settlements', 'settlements');

  readonly visibleRows = computed(() =>
    filterRows(this.archive.rows(this.rows()), this.filter(), (settlement) => [
      settlement.id,
      settlement.collectionId,
      this.recyclerName()(settlement.recyclerId),
      settlement.notes,
    ]),
  );

  readonly dialogVisible = signal(false);
  readonly editing = signal<Settlement | null>(null);
  readonly resetKey = signal(0);
  readonly title = computed(() =>
    this.editing() ? `Notas de la liquidación #${this.editing()?.id}` : 'Liquidar recolección',
  );

  readonly verification = signal<Verification | null>(null);
  readonly verifyVisible = signal(false);
  readonly verifying = signal<number | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.archive.reload();
    forkJoin({
      settlements: this.api.list(),
      collections: this.collectionsApi.list(),
      recyclers: readIf(this.session.canPermission('GET /api/recyclers'), () =>
        this.recyclersApi.list(),
      ),
      materials: readIf(this.session.canPermission('GET /api/materials'), () =>
        this.materialsApi.list(),
      ),
    }).subscribe({
      next: ({ settlements, collections, recyclers, materials }) => {
        this.rows.set(settlements);
        this.collections.set(collections);
        this.recyclers.set(recyclers);
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

  openNotes(settlement: Settlement): void {
    this.editing.set(settlement);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  /** Settling sends collection and notes; editing sends ONLY the notes. */
  save(value: SettlementCreatePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const request = current
      ? this.api.updateNotes(current.id, { notes: value.notes })
      : this.api.create(value);

    request.subscribe({
      next: (settlement) => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(
          current ? 'Notas actualizadas' : `Liquidación #${settlement.id} emitida`,
          current
            ? undefined
            : 'Totales congelados con la tarifa vigente en la fecha de la recolección.',
        );
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error(
          current ? 'No se pudieron guardar las notas' : 'No se pudo liquidar',
          toApiMessage(error),
        );
      },
    });
  }

  verify(settlement: Settlement): void {
    this.verifying.set(settlement.id);
    this.api.verify(settlement.id).subscribe({
      next: (report) => {
        this.verifying.set(null);
        this.verification.set(report);
        this.verifyVisible.set(true);
      },
      error: (error: unknown) => {
        this.verifying.set(null);
        this.notify.error('No se pudo verificar', toApiMessage(error));
      },
    });
  }

  /** Void: the settlement stays as history and the collection becomes editable again. */
  voidSettlement(settlement: Settlement): void {
    this.confirmation.confirm({
      header: 'Anular liquidación',
      message: `¿Anular la liquidación #${settlement.id}? La recolección #${settlement.collectionId} vuelve a quedar pendiente y se puede corregir.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar anulación',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.api.void(settlement.id).subscribe({
          next: () => {
            this.notify.warn(
              `Liquidación #${settlement.id} anulada`,
              `La recolección #${settlement.collectionId} quedó pendiente.`,
            );
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo anular', toApiMessage(error)),
        });
      },
    });
  }
}
