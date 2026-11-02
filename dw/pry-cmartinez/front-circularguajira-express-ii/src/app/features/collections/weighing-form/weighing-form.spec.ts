import { TestBed } from '@angular/core/testing';
import { Weighing, WeighingCreatePayload } from '../../../core/models/weighing.model';
import { WeighingForm } from './weighing-form';

const WEIGHING: Weighing = {
  id: 19,
  collectionId: 7,
  materialId: 3,
  rateId: 9,
  pricePerKg: 650,
  grossKg: '79.79',
  tareKg: '0.96',
  netKg: 78.83,
  amount: 51239.5,
  status: 'active',
};

describe('WeighingForm', () => {
  async function createForm(weighing: Weighing | null = null) {
    const fixture = TestBed.createComponent(WeighingForm);
    fixture.componentRef.setInput('collections', [{ id: 7, label: '#7 · 2026-10-14' }]);
    fixture.componentRef.setInput('materials', [
      { id: 3, name: 'Archivo', description: null, status: 'active' },
    ]);
    fixture.componentRef.setInput('weighing', weighing);
    await fixture.whenStable();
    const saved: WeighingCreatePayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => saved.push(payload));
    return { form: fixture.componentInstance, saved };
  }

  it('should block the submit without collection, material or with gross <= tare', async () => {
    const { form, saved } = await createForm();
    form.submit();
    expect(saved).toEqual([]);
    form.form.patchValue({ collectionId: 7, materialId: 3, grossKg: 2, tareKg: 2 });
    form.submit();
    expect(form.netIsPositive()).toBe(false);
    expect(saved).toEqual([]);
  });

  it('should emit the whole line when creating', async () => {
    const { form, saved } = await createForm();
    form.form.patchValue({ collectionId: 7, materialId: 3, grossKg: 12.5, tareKg: 0.5 });
    form.submit();
    expect(saved).toEqual([{ collectionId: 7, materialId: 3, grossKg: 12.5, tareKg: 0.5 }]);
  });

  it('should load DECIMAL weights as numbers and lock collection and material when editing', async () => {
    const { form } = await createForm(WEIGHING);
    expect(form.form.controls.grossKg.value).toBe(79.79);
    expect(form.form.controls.collectionId.disabled).toBe(true);
    expect(form.form.controls.materialId.disabled).toBe(true);
  });
});
