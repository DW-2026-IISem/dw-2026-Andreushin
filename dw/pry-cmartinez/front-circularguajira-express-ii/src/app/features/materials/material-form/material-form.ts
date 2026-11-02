import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../core/models/api.model';
import { Material, MaterialPayload } from '../../../core/models/material.model';

/**
 * Material form, reused to create and to edit (same pattern as `RecyclerForm`).
 * Limits mirror the backend: name 60 characters (unique), description 255.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-material-form',
  imports: [MessageModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, TextareaModule],
  templateUrl: './material-form.html',
  styleUrl: './material-form.css',
})
export class MaterialForm {
  readonly material = input<Material | null>(null);

  /** Key that resets the form when «Nuevo material» is opened again. */
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<MaterialPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', [Validators.maxLength(255)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.material();
      this.resetKey(); // reopening the dialog must empty the form
      this.form.reset({
        name: current?.name ?? '',
        description: current?.description ?? '',
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      name: value.name.trim(),
      description: value.description.trim() || null,
      ...(this.material() ? {} : { status: value.status }),
    });
  }
}
