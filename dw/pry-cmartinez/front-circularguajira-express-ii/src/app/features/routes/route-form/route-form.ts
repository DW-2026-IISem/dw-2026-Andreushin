import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../core/models/api.model';
import { Route, RoutePayload } from '../../../core/models/route.model';

/**
 * Collection route form (same pattern as `MaterialForm`).
 * Limits mirror the backend: name 80 (unique), municipality 60, description 255.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-route-form',
  imports: [
    MessageModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './route-form.html',
  styleUrl: './route-form.css',
})
export class RouteForm {
  readonly route = input<Route | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<RoutePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    municipality: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', [Validators.maxLength(255)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.route();
      this.resetKey(); // reopening the dialog must empty the form
      this.form.reset({
        name: current?.name ?? '',
        municipality: current?.municipality ?? '',
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
      municipality: value.municipality.trim(),
      description: value.description.trim() || null,
      ...(this.route() ? {} : { status: value.status }),
    });
  }
}
