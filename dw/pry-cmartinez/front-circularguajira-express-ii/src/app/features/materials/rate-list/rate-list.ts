import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Material } from '../../../core/models/material.model';
import { MaterialRate, MaterialRatePayload } from '../../../core/models/material-rate.model';
import { NotificationService } from '../../../core/services/notification';
import { toNumber } from '../../../core/models/api.model';
import { toApiMessage } from '../../../core/utils/api-error';
import { RateStatus, rateStatus } from '../../../core/utils/rate-status';
import { todayInColombia } from '../../../core/utils/weighing-math';
import { HasPermission } from '../../../shared/directives/has-permission';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { MaterialApi } from '../material-api';
import { RateForm } from '../rate-form/rate-form';

/**
 * Rate history per material (`GET /api/materials/:id/rates`) and the issue of a new rate
 * (`POST`). The rate in force on a date is the one the backend uses to price weighings and
 * settlements, so the history is append-only.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-rate-list',
  imports: [
    HasPermission,
    ButtonModule,
    CurrencyPipe,
    DatePipe,
    DialogModule,
    EmptyState,
    FormsModule,
    MessageModule,
    PageHeader,
    RateForm,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './rate-list.html',
  styleUrl: './rate-list.css',
})
export class RateList {
  private readonly api = inject(MaterialApi);
  private readonly notify = inject(NotificationService);

  /** `/rates?materialId=3` (component input binding) opens that material directly. */
  readonly materialId = input<string | undefined>(undefined);

  readonly today = todayInColombia();

  readonly materials = signal<Material[]>([]);
  readonly selected = signal<Material | null>(null);
  readonly rates = signal<MaterialRate[]>([]);
  readonly loadingMaterials = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly dialogVisible = signal(false);
  readonly resetKey = signal(0);

  readonly current = computed(
    () => this.rates().find((rate) => this.status(rate) === 'current') ?? null,
  );

  private readonly labels: Record<
    RateStatus,
    { value: string; severity: 'success' | 'info' | 'secondary' }
  > = {
    current: { value: 'Vigente', severity: 'success' },
    future: { value: 'Programada', severity: 'info' },
    closed: { value: 'Cerrada', severity: 'secondary' },
  };

  constructor() {
    this.api.list().subscribe({
      next: (materials) => {
        this.materials.set(materials);
        this.loadingMaterials.set(false);
        const wanted = Number(this.materialId());
        this.choose(materials.find((material) => material.id === wanted) ?? materials[0] ?? null);
      },
      error: (error: unknown) => {
        this.loadingMaterials.set(false);
        this.error.set(toApiMessage(error));
      },
    });

    // Changing the material reloads its history.
    effect(() => {
      const material = this.selected();
      if (material) {
        this.loadRates(material.id);
      }
    });
  }

  status(rate: MaterialRate): RateStatus {
    return rateStatus(rate, this.today);
  }

  label(rate: MaterialRate): { value: string; severity: 'success' | 'info' | 'secondary' } {
    return this.labels[this.status(rate)];
  }

  price(rate: MaterialRate): number {
    return toNumber(rate.pricePerKg);
  }

  choose(material: Material | null): void {
    this.selected.set(material);
    if (!material) {
      this.rates.set([]);
    }
  }

  loadRates(materialId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.rates(materialId).subscribe({
      next: (rates) => {
        this.rates.set(rates);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.rates.set([]);
        this.error.set(toApiMessage(error));
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: MaterialRatePayload): void {
    const material = this.selected();
    if (!material) {
      return;
    }
    this.saving.set(true);
    this.api.addRate(material.id, payload).subscribe({
      next: (rate) => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success('Tarifa registrada', `${material.name}: desde ${rate.validFrom}.`);
        this.loadRates(material.id);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo registrar la tarifa', toApiMessage(error));
      },
    });
  }
}
