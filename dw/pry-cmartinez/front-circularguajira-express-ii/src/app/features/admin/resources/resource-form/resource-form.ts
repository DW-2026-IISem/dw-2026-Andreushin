import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Status } from '../../../../core/models/api.model';
import { HTTP_METHODS, HttpMethod, Resource, ResourcePayload } from '../../../../core/models/resource.model';

/**
 * Same rule as `resource.validation.ts`: `/api` + lowercase segments or `:param`. A trailing
 * slash is accepted because the backend normalizes it away (and `submit` drops it too).
 */
export const RESOURCE_PATH_PATTERN = /^\/api(\/([a-z0-9-]+|:[A-Za-z]+))+\/?$/;

/** Resource form: the (method, path) pair is unique in the catalog (409 if it repeats). */
@Component({
  host: { class: 'block' },
  selector: 'app-resource-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule, SelectModule, TextareaModule],
  templateUrl: './resource-form.html',
  styleUrl: './resource-form.css',
})
export class ResourceForm {
  readonly resource = input<Resource | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<ResourcePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly methodOptions = HTTP_METHODS.map((method) => ({ label: method, value: method }));
  readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    method: ['GET' as HttpMethod, [Validators.required]],
    path: ['', [Validators.required, Validators.pattern(RESOURCE_PATH_PATTERN), Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(255)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.resource();
      this.resetKey();
      this.form.reset({
        method: current?.method ?? 'GET',
        path: current?.path ?? '',
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
    // The backend also drops a trailing slash; doing it here keeps the pattern check honest.
    const payload: ResourcePayload = {
      method: value.method,
      path: value.path.trim().replace(/\/+$/, ''),
      description: value.description.trim() || null,
    };
    this.saved.emit(this.resource() ? payload : { ...payload, status: value.status });
  }
}
