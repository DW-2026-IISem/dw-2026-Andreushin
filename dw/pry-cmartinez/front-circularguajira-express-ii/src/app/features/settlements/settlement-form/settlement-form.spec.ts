import { TestBed } from '@angular/core/testing';
import { Settlement, SettlementCreatePayload } from '../../../core/models/settlement.model';
import { SettlementForm } from './settlement-form';

const ISSUED: Settlement = {
  id: 1,
  collectionId: 3,
  recyclerId: 9,
  settledAt: '2026-10-14',
  totalNetKg: 1,
  totalAmount: 1,
  lineCount: 1,
  status: 'issued',
  notes: 'Pago en bodega',
};

describe('SettlementForm', () => {
  async function createForm(settlement: Settlement | null = null) {
    const fixture = TestBed.createComponent(SettlementForm);
    fixture.componentRef.setInput('pendingOptions', [
      { id: 7, label: '#7 · 2026-10-14 · Teodoro' },
    ]);
    fixture.componentRef.setInput('settlement', settlement);
    await fixture.whenStable();
    const saved: SettlementCreatePayload[] = [];
    fixture.componentInstance.saved.subscribe((payload) => saved.push(payload));
    return { form: fixture.componentInstance, saved };
  }

  it('should require a collection and emit trimmed notes or null', async () => {
    const { form, saved } = await createForm();
    form.submit();
    expect(saved).toEqual([]);
    form.form.patchValue({ collectionId: 7, notes: '   ' });
    form.submit();
    expect(saved).toEqual([{ collectionId: 7, notes: null }]);
  });

  it('should limit the notes to 255 characters', async () => {
    const { form } = await createForm();
    form.form.patchValue({ collectionId: 7, notes: 'n'.repeat(256) });
    expect(form.form.controls.notes.hasError('maxlength')).toBe(true);
  });

  it('should lock the collection and load the notes when editing', async () => {
    const { form } = await createForm(ISSUED);
    expect(form.form.controls.collectionId.disabled).toBe(true);
    expect(form.form.controls.notes.value).toBe('Pago en bodega');
  });
});
