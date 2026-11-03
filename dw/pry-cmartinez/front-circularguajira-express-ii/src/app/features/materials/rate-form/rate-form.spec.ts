import { TestBed } from '@angular/core/testing';
import { MaterialRatePayload } from '../../../core/models/material-rate.model';
import { RateForm } from './rate-form';

describe('RateForm', () => {
  async function create() {
    await TestBed.configureTestingModule({ imports: [RateForm] }).compileComponents();
    const fixture = TestBed.createComponent(RateForm);
    await fixture.whenStable();
    const emitted: MaterialRatePayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => emitted.push(payload));
    return { fixture, form: fixture.componentInstance, emitted };
  }

  it('should start today and send an open rate with 2 decimals', async () => {
    const { form, emitted } = await create();
    expect(form.form.controls.validFrom.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    form.form.patchValue({ pricePerKg: 512.456, validFrom: '2026-11-02' });
    form.submit();
    expect(emitted[0]).toEqual({ pricePerKg: 512.46, validFrom: '2026-11-02', validTo: null });
  });

  it('should reject a zero price and a period that ends before it starts', async () => {
    const { form, emitted } = await create();
    form.form.patchValue({ pricePerKg: 0, validFrom: '2026-11-02' });
    form.submit();
    form.form.patchValue({ pricePerKg: 100, validFrom: '2026-11-10', validTo: '2026-11-01' });
    form.submit();
    expect(emitted).toHaveLength(0);
    expect(form.form.hasError('periodOrder')).toBe(true);
  });

  it('should start again from today every time the dialog is reopened', async () => {
    const { fixture, form } = await create();
    form.form.patchValue({ pricePerKg: 400, validFrom: '2026-10-01' });
    fixture.componentRef.setInput('resetKey', 1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(form.form.controls.validFrom.value).not.toBe('2026-10-01');
    expect(form.form.controls.pricePerKg.value).toBeNull();
  });
});
