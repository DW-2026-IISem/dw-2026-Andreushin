import { Component, effect, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MaterialRatePayload } from '../../../core/models/material-rate.model';
import { todayInColombia } from '../../../core/utils/weighing-math';

/** Same limit as `material.validation.ts` of the backend. */
export const MAX_PRICE_PER_KG = 9_999_999.99;

/** `validTo`, when given, cannot be before `validFrom` (the backend answers 400). */
function periodOrder(group: AbstractControl): ValidationErrors | null {
  const { validFrom, validTo } = group.value as { validFrom?: string; validTo?: string };
  return validFrom && validTo && validTo < validFrom ? { periodOrder: true } : null;
}

/**
 * New rate of a material. Rates are never edited (settlements must stay verifiable): a
 * change of price is a new rate from a new date, and the backend closes the open one.
 */
@Component({
  host: { class: 'block' },
  selector: 'app-rate-form',
  imports: [ReactiveFormsModule, ButtonModule, InputNumberModule, InputTextModule, MessageModule],
  templateUrl: './rate-form.html',
  styleUrl: './rate-form.css',
})
export class RateForm {
  readonly materialName = input('');
  readonly resetKey = input(0);
  readonly saving = input(false);

  readonly saved = output<MaterialRatePayload>();
  readonly cancelled = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly maxPrice = MAX_PRICE_PER_KG;

  readonly form = this.fb.group(
    {
      pricePerKg: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(0.01),
        Validators.max(MAX_PRICE_PER_KG),
      ]),
      validFrom: ['', [Validators.required]],
      validTo: [''],
    },
    { validators: periodOrder },
  );

  constructor() {
    // Reads `resetKey` directly: every opening of the dialog starts from today again. (Through
    // a `computed` of today's date the effect did not re-run, because the date did not change.)
    effect(() => {
      this.resetKey();
      this.form.reset({ pricePerKg: null, validFrom: todayInColombia(), validTo: '' });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      pricePerKg: Math.round(Number(value.pricePerKg) * 100) / 100,
      validFrom: value.validFrom,
      validTo: value.validTo || null,
    });
  }
}
