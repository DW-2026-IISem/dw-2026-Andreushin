import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../core/models/api.model';
import {
  CollectionPoint,
  CollectionPointPayload,
} from '../../../core/models/collection-point.model';
import { Route } from '../../../core/models/route.model';

/**
 * Collection point form: the first many-to-one relation (point → route).
 *
 * `routes` comes from the parent with the ACTIVE routes the backend returned; the select
 * uses `optionValue="id"`, so the form keeps a number (`routeId`), not the route object.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-collection-point-form',
  imports: [
    MessageModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './collection-point-form.html',
  styleUrl: './collection-point-form.css',
})
export class CollectionPointForm {
  readonly point = input<CollectionPoint | null>(null);
  readonly routes = input<Route[]>([]);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<CollectionPointPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    routeId: [null as number | null, [Validators.required]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    visitOrder: [1 as number | null, [Validators.required, Validators.min(1), Validators.max(999)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.point();
      this.resetKey(); // reopening the dialog must empty the form
      this.form.reset({
        routeId: current?.routeId ?? null,
        name: current?.name ?? '',
        address: current?.address ?? '',
        visitOrder: current?.visitOrder ?? 1,
        status: current?.status ?? 'active',
      });

      // PATCH/PUT do not accept `status`: the state only changes with /deactivate.
      if (current) {
        this.form.controls.status.disable();
      } else {
        this.form.controls.status.enable();
      }
    });
  }

  submit(): void {
    const value = this.form.getRawValue();
    if (this.form.invalid || value.routeId === null || value.visitOrder === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit({
      routeId: value.routeId,
      name: value.name.trim(),
      address: value.address.trim(),
      visitOrder: Number(value.visitOrder),
      ...(this.point() ? {} : { status: value.status }),
    });
  }
}
