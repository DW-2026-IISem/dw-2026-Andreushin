import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Collection } from '../../../core/models/collection.model';
import { Material } from '../../../core/models/material.model';
import { StatusTag } from '../../../shared/ui/status-tag/status-tag';

/**
 * Presentational detail of a collection: header + weighings + totals.
 *
 * It does not call the backend: the parent passes the collection already loaded (with its
 * weighings) and the catalogs to resolve names.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-collection-detail',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, StatusTag, TableModule, TagModule],
  templateUrl: './collection-detail.html',
  styleUrl: './collection-detail.css',
})
export class CollectionDetail {
  readonly collection = input.required<Collection>();
  readonly materials = input<Material[]>([]);
  readonly recyclerName = input('');
  readonly routeName = input('');

  readonly materialName = computed(() => {
    const names = new Map(this.materials().map((material) => [material.id, material.name]));
    return (id: number) => names.get(id) ?? `Material #${id}`;
  });

  readonly weighingCount = computed(() => this.collection().weighings?.length ?? 0);
}
