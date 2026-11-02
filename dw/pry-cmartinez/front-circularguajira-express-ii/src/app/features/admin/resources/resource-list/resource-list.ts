import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { NotificationService } from '../../../../core/services/notification';
import { toApiMessage } from '../../../../core/utils/api-error';
import { filterRows } from '../../../../core/utils/filter-rows';
import { methodSeverity } from '../../../../core/utils/http-method';
import { HasPermission } from '../../../../shared/directives/has-permission';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { StatusTag } from '../../../../shared/ui/status-tag/status-tag';
import {
  HTTP_METHODS,
  HttpMethod,
  Resource,
  ResourcePayload,
} from '../../../../core/models/resource.model';
import { ResourceApi } from '../resource-api';
import { ResourceForm } from '../resource-form/resource-form';

/**
 * Catalog of protected operations: one row per (method, path) pair. It is what can be
 * granted to a role; the backend checks every request against it (deny by default).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-resource-list',
  imports: [
    HasPermission,
    ButtonModule,
    DialogModule,
    EmptyState,
    FormsModule,
    InputTextModule,
    MessageModule,
    PageHeader,
    ResourceForm,
    SelectModule,
    StatusTag,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './resource-list.html',
  styleUrl: './resource-list.css',
})
export class ResourceList {
  private readonly api = inject(ResourceApi);
  private readonly notify = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationService);

  readonly methodSeverity = methodSeverity;
  readonly methods = HTTP_METHODS;
  readonly methodOptions = [
    { label: 'Todos los métodos', value: null },
    ...HTTP_METHODS.map((method) => ({ label: method, value: method })),
  ];

  readonly rows = signal<Resource[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly filter = signal('');
  readonly dialogVisible = signal(false);
  readonly editing = signal<Resource | null>(null);
  readonly resetKey = signal(0);
  readonly methodFilter = signal<HttpMethod | null>(null);

  /** How many resources each method has, for the header counters. */
  readonly countsByMethod = computed(() => {
    const counts = new Map<HttpMethod, number>();
    for (const row of this.rows()) {
      counts.set(row.method, (counts.get(row.method) ?? 0) + 1);
    }
    return counts;
  });

  readonly visibleRows = computed(() => {
    const method = this.methodFilter();
    const filtered = filterRows(this.rows(), this.filter(), (row) => [
      row.path,
      row.description,
      row.method,
    ]);
    return method ? filtered.filter((row) => row.method === method) : filtered;
  });

  readonly title = computed(() => (this.editing() ? 'Editar recurso' : 'Nuevo recurso'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
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

  openEdit(row: Resource): void {
    this.editing.set(row);
    this.resetKey.update((key) => key + 1);
    this.dialogVisible.set(true);
  }

  save(payload: ResourcePayload): void {
    const current = this.editing();
    this.saving.set(true);
    const request = current ? this.api.update(current.id, payload) : this.api.create(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.notify.success(current ? 'Recurso actualizado' : 'Recurso creado');
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notify.error('No se pudo guardar', toApiMessage(error));
      },
    });
  }

  deactivate(row: Resource): void {
    this.confirmation.confirm({
      header: 'Baja lógica',
      message: `¿Desactivar ${row.method + ' ' + row.path}? Ningún rol podrá usarlo mientras esté inactivo.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () =>
        this.api.deactivate(row.id).subscribe({
          next: () => {
            this.notify.warn('Recurso desactivado');
            this.load();
          },
          error: (error: unknown) =>
            this.notify.error('No se pudo desactivar', toApiMessage(error)),
        }),
    });
  }

  remove(row: Resource): void {
    this.confirmation.confirm({
      header: 'Eliminar definitivamente',
      message: `Se borrará ${row.method + ' ' + row.path}. Rompe el historial de las concesiones que lo apunten; para el día a día usa la baja lógica.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () =>
        this.api.remove(row.id).subscribe({
          next: () => {
            this.notify.success('Recurso eliminado');
            this.load();
          },
          error: (error: unknown) => this.notify.error('No se pudo eliminar', toApiMessage(error)),
        }),
    });
  }
}
