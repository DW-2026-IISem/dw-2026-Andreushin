import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { forkJoin } from 'rxjs';
import { toNumber } from '../../core/models/api.model';
import { Collection } from '../../core/models/collection.model';
import { Material } from '../../core/models/material.model';
import { Recycler } from '../../core/models/recycler.model';
import { Settlement } from '../../core/models/settlement.model';
import { toApiMessage } from '../../core/utils/api-error';
import { round2 } from '../../core/utils/weighing-math';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { CollectionApi } from '../collections/collection-api';
import { MaterialApi } from '../materials/material-api';
import { RecyclerApi } from '../recyclers/recycler-api';
import { SettlementApi } from '../settlements/settlement-api';

/**
 * Operations panel. The API is queried ONCE (four requests in parallel); every indicator is
 * a `computed` derived from those lists, so the KPIs always match the listings.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-dashboard',
  imports: [
    ButtonModule,
    CardModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    MessageModule,
    PageHeader,
    RouterLink,
    SkeletonModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly recyclersApi = inject(RecyclerApi);
  private readonly materialsApi = inject(MaterialApi);
  private readonly collectionsApi = inject(CollectionApi);
  private readonly settlementsApi = inject(SettlementApi);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly recyclers = signal<Recycler[]>([]);
  readonly materials = signal<Material[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly settlements = signal<Settlement[]>([]);

  readonly recyclerName = computed(() => {
    const names = new Map(this.recyclers().map((recycler) => [recycler.id, recycler.name]));
    return (id: number) => names.get(id) ?? `Reciclador #${id}`;
  });

  /** Value of the active collections, as stored by the backend (DECIMAL normalized). */
  readonly collectedAmount = computed(() =>
    round2(this.collections().reduce((sum, collection) => sum + toNumber(collection.totalAmount), 0)),
  );

  readonly collectedKg = computed(() =>
    round2(this.collections().reduce((sum, collection) => sum + toNumber(collection.totalNetKg), 0)),
  );

  /** Active collections without an issued settlement: what finance still has to pay. */
  readonly unsettled = computed(() => {
    const settled = new Set(
      this.settlements().filter((settlement) => settlement.status === 'issued').map((settlement) => settlement.collectionId),
    );
    return this.collections().filter((collection) => !settled.has(collection.id));
  });

  readonly pendingAmount = computed(() =>
    round2(this.unsettled().reduce((sum, collection) => sum + toNumber(collection.totalAmount), 0)),
  );

  readonly latestCollections = computed(() =>
    [...this.collections()]
      .sort((a, b) => b.collectedOn.localeCompare(a.collectedOn) || b.id - a.id)
      .slice(0, 5),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      recyclers: this.recyclersApi.list(),
      materials: this.materialsApi.list(),
      collections: this.collectionsApi.list(),
      settlements: this.settlementsApi.list(),
    }).subscribe({
      next: ({ recyclers, materials, collections, settlements }) => {
        this.recyclers.set(recyclers);
        this.materials.set(materials);
        this.collections.set(collections);
        this.settlements.set(settlements);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }
}
