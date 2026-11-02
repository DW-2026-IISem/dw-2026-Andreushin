import { Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Status } from '../../../../core/models/api.model';
import { User, UserCreatePayload, UserUpdatePayload } from '../../../../core/models/user.model';

/** Same rules as `user.validation.ts` of the backend. */
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,80}$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const URL_PATTERN = /^https?:\/\/\S+$/;

export type UserFormPayload = UserCreatePayload | UserUpdatePayload;

/**
 * User form for create and edit. Password and status only exist on create: `PATCH
 * /api/users/:id` rejects them (the password has its own endpoint, the status /deactivate).
 */
@Component({
  host: { class: 'block' },
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule, SelectModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserForm {
  readonly user = input<User | null>(null);
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<UserFormPayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly statusOptions: { label: string; value: Status }[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
    avatar: ['', [Validators.pattern(URL_PATTERN), Validators.maxLength(500)]],
    status: ['active' as Status, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const current = this.user();
      this.resetKey();
      this.form.reset({
        username: current?.username ?? '',
        email: current?.email ?? '',
        password: '',
        avatar: current?.avatar ?? '',
        status: current?.status ?? 'active',
      });
      const { password, status } = this.form.controls;
      if (current) {
        password.disable();
        status.disable();
      } else {
        password.enable();
        status.enable();
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: UserUpdatePayload = {
      username: value.username.trim(),
      email: value.email.trim(),
      avatar: value.avatar.trim() || null,
    };
    // password + status only exist on create; sending them in the PATCH answers 400.
    this.saved.emit(this.user() ? payload : { ...payload, password: value.password, status: value.status });
  }
}
