import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../core/models/api.model';
import { Recycler, RecyclerPayload, RecyclerType } from '../../../core/models/recycler.model';

/** Same patterns as the backend validation (`recycler.validation.ts`). */
const DOCUMENT_PATTERN = /^\d{5,15}(-\d)?$/;
const PHONE_PATTERN = /^\+?\d{7,15}$/;

/**
 * Recycler form, reused to create and to edit.
 *
 * It does not call the API: it receives `recycler` (or `null` to create) and emits the
 * payload with `saved`. The parent chooses between `POST` and `PATCH` and controls the
 * dialog, so this component works the same inside a Dialog or on a page.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-recycler-form',
  imports: [MessageModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './recycler-form.html',
  styleUrl: './recycler-form.css',
})
export class RecyclerForm {
  /** Recycler to edit. `null` leaves the form in create mode. */
  readonly recycler = input<Recycler | null>(null);

  /**
   * Changes every time the parent opens the dialog.
   *
   * Without it, reopening «Nuevo reciclador» after cancelling would keep what was typed:
   * `recycler` is still `null`, so the `effect()` would not run again.
   */
  readonly resetKey = input(0);

  /** Request in progress: disables the button and shows its spinner. */
  readonly saving = input(false);

  readonly saved = output<RecyclerPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly typeOptions: { label: string; value: RecyclerType }[] = [
    { label: 'Independiente', value: 'independent' },
    { label: 'Organización', value: 'organization' },
  ];

  readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    documentNumber: ['', [Validators.required, Validators.pattern(DOCUMENT_PATTERN)]],
    recyclerType: ['independent' as RecyclerType, [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    address: ['', [Validators.maxLength(200)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    // `effect()` reacts to the `recycler()` input: the same form creates and edits without
    // `ngOnChanges` or comparing objects by hand.
    effect(() => {
      const current = this.recycler();
      // `resetKey` is read on purpose: reopening the dialog must empty the form even if
      // `recycler` is still `null`.
      this.resetKey();

      this.form.reset({
        name: current?.name ?? '',
        documentNumber: current?.documentNumber ?? '',
        recyclerType: current?.recyclerType ?? 'independent',
        phone: current?.phone ?? '',
        email: current?.email ?? '',
        address: current?.address ?? '',
        status: current?.status ?? 'active',
      });

      // The backend only changes `status` with PATCH /deactivate. An enabled field would
      // promise something the edit does not do.
      if (current) {
        this.form.controls.status.disable();
      } else {
        this.form.controls.status.enable();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: RecyclerPayload = {
      name: value.name.trim(),
      documentNumber: value.documentNumber.trim(),
      recyclerType: value.recyclerType,
      phone: value.phone.trim(),
      email: value.email.trim() || null,
      address: value.address.trim() || null,
    };

    // `status` is only sent on create: when editing, /deactivate governs it.
    this.saved.emit(this.recycler() ? payload : { ...payload, status: value.status });
  }
}
