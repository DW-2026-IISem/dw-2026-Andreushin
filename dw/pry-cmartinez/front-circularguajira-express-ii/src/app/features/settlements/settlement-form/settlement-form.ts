import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Collection } from '../../../core/models/collection.model';
import { Settlement, SettlementCreatePayload } from '../../../core/models/settlement.model';

/** Option of the pending collections select. */
export interface PendingCollectionOption {
  id: number;
  label: string;
}

/**
 * Settles a collection or edits the notes of an issued settlement.
 *
 * Creating only sends `collectionId` and `notes`: the backend reprices every line with the
 * rate in force on the collection date and freezes the totals. Editing changes ONLY the
 * notes; the settled values never change (a wrong settlement is voided and issued again).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-settlement-form',
  imports: [ButtonModule, CurrencyPipe, DecimalPipe, MessageModule, ReactiveFormsModule, SelectModule, TextareaModule],
  templateUrl: './settlement-form.html',
  styleUrl: './settlement-form.css',
})
export class SettlementForm {
  readonly settlement = input<Settlement | null>(null);
  readonly pending = input<Collection[]>([]);
  readonly pendingOptions = input<PendingCollectionOption[]>([]);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<SettlementCreatePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    collectionId: [null as number | null, [Validators.required]],
    notes: ['', [Validators.maxLength(255)]],
  });

  constructor() {
    effect(() => {
      const current = this.settlement();
      this.resetKey(); // reopening the dialog must empty the form
      this.form.reset({ collectionId: current?.collectionId ?? null, notes: current?.notes ?? '' });
      if (current) {
        this.form.controls.collectionId.disable();
      } else {
        this.form.controls.collectionId.enable();
      }
    });
  }

  /** Collection chosen in the select, to preview what will be settled. */
  previewOf(id: number | null): Collection | null {
    return this.pending().find((collection) => collection.id === id) ?? null;
  }

  submit(): void {
    const value = this.form.getRawValue();
    if (this.form.invalid || value.collectionId === null) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit({ collectionId: value.collectionId, notes: value.notes.trim() || null });
  }
}
