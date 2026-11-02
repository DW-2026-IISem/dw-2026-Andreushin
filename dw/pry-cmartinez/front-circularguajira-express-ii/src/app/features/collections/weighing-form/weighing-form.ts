import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { toNumber } from '../../../core/models/api.model';
import { Material } from '../../../core/models/material.model';
import { Weighing, WeighingCreatePayload } from '../../../core/models/weighing.model';

/** Option of the collection select: `#id · date · recycler`. */
export interface CollectionOption {
  id: number;
  label: string;
}

/**
 * Single weighing form. Creating adds a line to an open collection; editing only changes
 * gross and tare (collection and material are fixed: PATCH does not accept them, and the
 * state changes only with /deactivate). Express reprices and recalculates the totals.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-weighing-form',
  imports: [ButtonModule, InputNumberModule, MessageModule, ReactiveFormsModule, SelectModule],
  templateUrl: './weighing-form.html',
  styleUrl: './weighing-form.css',
})
export class WeighingForm {
  readonly weighing = input<Weighing | null>(null);
  readonly collections = input<CollectionOption[]>([]);
  readonly materials = input<Material[]>([]);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<WeighingCreatePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    collectionId: [null as number | null, [Validators.required]],
    materialId: [null as number | null, [Validators.required]],
    grossKg: [
      null as number | null,
      [Validators.required, Validators.min(0.01), Validators.max(100_000)],
    ],
    tareKg: [0 as number | null, [Validators.min(0), Validators.max(100_000)]],
  });

  constructor() {
    effect(() => {
      const current = this.weighing();
      this.resetKey(); // reopening the dialog must empty the form
      this.form.reset({
        collectionId: current?.collectionId ?? null,
        materialId: current?.materialId ?? null,
        grossKg: current ? toNumber(current.grossKg) : null,
        tareKg: current ? toNumber(current.tareKg) : 0,
      });

      if (current) {
        this.form.controls.collectionId.disable();
        this.form.controls.materialId.disable();
      } else {
        this.form.controls.collectionId.enable();
        this.form.controls.materialId.enable();
      }
    });
  }

  /** Gross must be greater than tare, like `ensureNetWeight` in the backend. */
  netIsPositive(): boolean {
    const { grossKg, tareKg } = this.form.getRawValue();
    return grossKg !== null && grossKg > (tareKg ?? 0);
  }

  submit(): void {
    const value = this.form.getRawValue();
    if (
      this.form.invalid ||
      value.collectionId === null ||
      value.materialId === null ||
      !this.netIsPositive()
    ) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit({
      collectionId: value.collectionId,
      materialId: value.materialId,
      grossKg: Number(value.grossKg),
      tareKg: Number(value.tareKg ?? 0),
    });
  }
}
