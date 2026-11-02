import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth';
import { toApiMessage } from '../../../core/utils/api-error';

/**
 * Session form. `POST /api/session/login` returns only tokens; `AuthService.login()` chains
 * profile + permissions and emits once the session is complete, so the screen navigates
 * with a full menu.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, MessageModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly appName = environment.appName;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    identifier: ['', [Validators.required, Validators.maxLength(150)]],
    password: ['', [Validators.required, Validators.maxLength(200)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { identifier, password } = this.form.getRawValue();
    // `identifier` accepts username or email; the backend reads device info from the User-Agent.
    this.auth.login({ identifier: identifier.trim(), password }).subscribe({
      next: () => void this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'))),
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(toApiMessage(error));
      },
    });
  }
}

/** Only internal paths: `//evil.com` or `https://…` would be an open redirect. */
export function safeReturnUrl(requested: string | null): string {
  if (!requested || !requested.startsWith('/') || requested.startsWith('//') || requested.startsWith('/login')) {
    return '/dashboard';
  }
  return requested;
}
