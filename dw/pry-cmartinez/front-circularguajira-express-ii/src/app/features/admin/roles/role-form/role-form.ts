import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../../core/models/api.model';
import { Role, RolePayload } from '../../../../core/models/role.model';

/** Same rule as `role.validation.ts`: a letter, then letters or `_`. */
export const ROLE_NAME_PATTERN = /^[A-Za-z][A-Za-z_]{1,79}$/;

/**
 * Role form. The name is sent in UPPERCASE, as the backend stores it, so the UI and the
 * grants always match. `status` only goes on create.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-role-form',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './role-form.html',
  styleUrl: './role-form.css',
})
export class RoleForm {
  readonly role = input<Role | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<RolePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(ROLE_NAME_PATTERN)]],
    description: ['', [Validators.maxLength(255)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.role();
      this.resetKey();
      this.form.reset({
        name: current?.name ?? '',
        description: current?.description ?? '',
        status: current?.status ?? 'active',
      });
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
    const payload: RolePayload = {
      name: value.name.trim().toUpperCase(),
      description: value.description.trim() || null,
    };
    this.saved.emit(this.role() ? payload : { ...payload, status: value.status });
  }
}
