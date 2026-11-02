import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Material } from '../../../core/models/material.model';
import { SettlementVerification as Verification } from '../../../core/models/settlement.model';

/**
 * Presentational result of `GET /api/settlements/:id/verify`: the backend recalculates every
 * line with the rate of the collection date and compares it with the stored values.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-settlement-verification',
  imports: [CurrencyPipe, DecimalPipe, MessageModule, TableModule, TagModule],
  templateUrl: './settlement-verification.html',
  styleUrl: './settlement-verification.css',
})
export class SettlementVerification {
  readonly report = input.required<Verification>();
  readonly materials = input<Material[]>([]);

  readonly materialName = computed(() => {
    const names = new Map(this.materials().map((material) => [material.id, material.name]));
    return (id: number) => names.get(id) ?? `Material #${id}`;
  });

  /** Lines where the net weight, the amount or the rate do not match. */
  readonly failedLines = computed(
    () =>
      this.report().lines.filter((line) => !line.netOk || !line.amountOk || !line.rateOk).length,
  );
}
