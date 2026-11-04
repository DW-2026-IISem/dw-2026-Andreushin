import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ArchiveScope, RecordScope } from '../../../core/utils/archive-scope';
import { HasPermission } from '../../directives/has-permission';

/** What the filter uses of an `ArchiveScope`, whatever the row type. */
export type ArchiveFilterControl = Pick<
  ArchiveScope<{ id: number }>,
  'permission' | 'loading' | 'scope' | 'choose'
>;

/** Active / inactive / all selector; only painted for sessions with the archive grant. */
@Component({
  host: { class: 'contents' },
  selector: 'app-record-scope-filter',
  imports: [FormsModule, HasPermission, SelectModule],
  template: `
    <ng-container *appHasPermission="archive().permission">
      <p-select
        ariaLabel="Mostrar registros"
        [options]="options"
        optionLabel="label"
        optionValue="value"
        [loading]="archive().loading()"
        [ngModel]="archive().scope()"
        (ngModelChange)="archive().choose($event)"
        styleClass="w-36"
      />
    </ng-container>
  `,
})
export class RecordScopeFilter {
  readonly archive = input.required<ArchiveFilterControl>();

  readonly options: { label: string; value: RecordScope }[] = [
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    { label: 'Todos', value: 'all' },
  ];
}
