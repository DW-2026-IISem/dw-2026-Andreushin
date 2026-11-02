import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { forkJoin } from 'rxjs';
import { Material } from '../../../core/models/material.model';
import { MaterialRate } from '../../../core/models/material-rate.model';
import { Recycler } from '../../../core/models/recycler.model';
import { Route } from '../../../core/models/route.model';
import { WeighingLineInput } from '../../../core/models/weighing.model';
import { NotificationService } from '../../../core/services/notification';
import { toApiMessage } from '../../../core/utils/api-error';
import { LinePreview, previewLine, sumPreviews, todayInColombia } from '../../../core/utils/weighing-math';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { MaterialApi } from '../../materials/material-api';
import { RecyclerApi } from '../../recyclers/recycler-api';
import { RouteApi } from '../../routes/route-api';
import { CollectionApi } from '../collection-api';

/** Backend limits (`weighing.validation.ts`). */
const MAX_KG = 100_000;
const MAX_LINES = 50;

/**
 * New collection: a local draft of weighings that is sent in ONE transactional POST.
 *
 * Adding a line never touches the server (only the rate in force is read to preview the
 * amount). The UI sends recycler, route, date and gross/tare per line; Express prices every
 * line with the rate in force on `collectedOn`, stores the header and its weighings in one
 * transaction and rolls everything back if any line fails.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-collection-form',
  imports: [
    ButtonModule,
    CardModule,
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    PageHeader,
    RouterLink,
    SelectModule,
    TableModule,
  ],
  templateUrl: './collection-form.html',
  styleUrl: './collection-form.css',
})
export class CollectionForm {
  private readonly api = inject(CollectionApi);
  private readonly recyclersApi = inject(RecyclerApi);
  private readonly routesApi = inject(RouteApi);
  private readonly materialsApi = inject(MaterialApi);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly today = todayInColombia();

  readonly recyclers = signal<Recycler[]>([]);
  readonly routes = signal<Route[]>([]);
  readonly materials = signal<Material[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly recyclerId = signal<number | null>(null);
  readonly routeId = signal<number | null>(null);
  readonly collectedOn = signal(this.today);

  /** Draft weighings: each one is a scale reading (the same material may repeat). */
  readonly lines = signal<WeighingLineInput[]>([]);
  readonly selectedMaterialId = signal<number | null>(null);
  readonly grossKg = signal<number | null>(null);
  readonly tareKg = signal<number | null>(0);
  readonly checkingRate = signal(false);

  /** Rate in force on `collectedOn` per material, read only to preview amounts. */
  readonly rates = signal(new Map<number, MaterialRate>());

  readonly materialById = computed(() => new Map(this.materials().map((material) => [material.id, material])));

  readonly previews = computed<LinePreview[]>(() =>
    this.lines().map((line) =>
      previewLine(line.grossKg, line.tareKg, this.rates().get(line.materialId)?.pricePerKg),
    ),
  );

  readonly totals = computed(() => sumPreviews(this.previews()));

  constructor() {
    this.load();
  }

  /** Active recyclers, routes and materials in parallel. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      recyclers: this.recyclersApi.list(),
      routes: this.routesApi.list(),
      materials: this.materialsApi.list(),
    }).subscribe({
      next: ({ recyclers, routes, materials }) => {
        this.recyclers.set(recyclers);
        this.routes.set(routes);
        this.materials.set(materials);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  materialName(id: number): string {
    return this.materialById().get(id)?.name ?? `Material #${id}`;
  }

  rateOf(id: number): MaterialRate | undefined {
    return this.rates().get(id);
  }

  /**
   * Preventive checks, the same as the backend: material chosen, gross > 0, tare >= 0,
   * gross > tare, at most 100 000 kg and 50 lines, and a rate in force on the date.
   */
  addLine(): void {
    const materialId = this.selectedMaterialId();
    const grossKg = Number(this.grossKg());
    const tareKg = Number(this.tareKg() ?? 0);
    this.error.set(null);

    if (materialId === null) {
      this.error.set('Selecciona un material.');
      return;
    }
    if (!Number.isFinite(grossKg) || grossKg <= 0 || grossKg > MAX_KG) {
      this.error.set(`El peso bruto debe ser mayor que 0 y como máximo ${MAX_KG} kg.`);
      return;
    }
    if (!Number.isFinite(tareKg) || tareKg < 0 || tareKg > MAX_KG) {
      this.error.set('La tara no puede ser negativa.');
      return;
    }
    if (grossKg <= tareKg) {
      this.error.set(`El peso bruto (${grossKg}) debe ser mayor que la tara (${tareKg}).`);
      return;
    }
    if (this.lines().length >= MAX_LINES) {
      this.error.set(`Máximo ${MAX_LINES} pesajes por recolección.`);
      return;
    }

    const append = (): void => {
      this.lines.update((lines) => [...lines, { materialId, grossKg, tareKg }]);
      this.selectedMaterialId.set(null);
      this.grossKg.set(null);
      this.tareKg.set(0);
    };

    if (this.rates().has(materialId)) {
      append();
      return;
    }

    // GET only: the rate is read to preview the amount; nothing is written.
    this.checkingRate.set(true);
    this.materialsApi.currentRate(materialId, this.collectedOn()).subscribe({
      next: (rate) => {
        this.checkingRate.set(false);
        this.rates.update((rates) => new Map(rates).set(materialId, rate));
        append();
      },
      error: (error: unknown) => {
        this.checkingRate.set(false);
        this.error.set(toApiMessage(error));
      },
    });
  }

  removeLine(index: number): void {
    this.lines.update((lines) => lines.filter((_, position) => position !== index));
  }

  /** A new date means other rates: the previews are re-read for the materials in the draft. */
  changeDate(date: string): void {
    this.collectedOn.set(date);
    this.rates.set(new Map());
    const ids = [...new Set(this.lines().map((line) => line.materialId))];
    if (ids.length === 0 || !date) {
      return;
    }
    forkJoin(ids.map((id) => this.materialsApi.currentRate(id, date))).subscribe({
      next: (rates) => this.rates.set(new Map(rates.map((rate) => [rate.materialId, rate]))),
      error: (error: unknown) => this.error.set(toApiMessage(error)),
    });
  }

  save(): void {
    const recyclerId = this.recyclerId();
    const routeId = this.routeId();
    if (recyclerId === null) {
      this.error.set('Selecciona un reciclador activo.');
      return;
    }
    if (routeId === null) {
      this.error.set('Selecciona una ruta activa.');
      return;
    }
    if (!this.collectedOn() || this.collectedOn() > this.today) {
      this.error.set('La fecha de recolección no puede ser futura.');
      return;
    }
    if (this.lines().length === 0) {
      this.error.set('La recolección requiere al menos un pesaje.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    // No prices or totals: Express calculates them inside the transaction.
    this.api
      .create({ recyclerId, routeId, collectedOn: this.collectedOn(), weighings: this.lines() })
      .subscribe({
        next: (collection) => {
          this.saving.set(false);
          this.notify.success(`Recolección #${collection.id} registrada`, 'Pesajes y totales calculados por el backend.');
          void this.router.navigate(['/collections']);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          const message = toApiMessage(error);
          this.error.set(message);
          this.notify.error('La recolección no se registró', message);
        },
      });
  }
}
