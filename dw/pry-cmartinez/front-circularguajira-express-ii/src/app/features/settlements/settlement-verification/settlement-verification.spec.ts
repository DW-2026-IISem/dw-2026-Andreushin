import { TestBed } from '@angular/core/testing';
import { SettlementVerification as Verification } from '../../../core/models/settlement.model';
import { SettlementVerification } from './settlement-verification';

const LINE = { weighingId: 19, materialId: 3, grossKg: 79.79, tareKg: 0.96, netKg: 78.83, pricePerKg: 650, amount: 51239.5, rateId: 9, rateValidFrom: '2026-10-01', rateValidTo: null, netOk: true, amountOk: true, rateOk: true };

function report(overrides: Partial<Verification> = {}): Verification {
  return {
    settlementId: 1, status: 'issued', collectionId: 3, collectedOn: '2026-10-14', consistent: true,
    stored: { totalNetKg: 78.83, totalAmount: 51239.5, lineCount: 1 },
    recomputed: { totalNetKg: 78.83, totalAmount: 51239.5, lineCount: 1 },
    lines: [LINE],
    ...overrides,
  };
}

describe('SettlementVerification', () => {
  async function render(value: Verification) {
    const fixture = TestBed.createComponent(SettlementVerification);
    fixture.componentRef.setInput('report', value);
    fixture.componentRef.setInput('materials', [{ id: 3, name: 'Archivo', description: null, status: 'active' }]);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('should say the settlement is consistent and show each line', async () => {
    const { element } = await render(report());
    expect(element.textContent).toContain('Liquidación consistente');
    expect(element.textContent).toContain('Archivo');
  });

  it('should count the lines that do not match', async () => {
    const { fixture, element } = await render(report({ consistent: false, lines: [LINE, { ...LINE, weighingId: 20, amountOk: false }] }));
    expect(fixture.componentInstance.failedLines()).toBe(1);
    expect(element.textContent).toContain('1 pesaje(s) no coinciden');
  });
});
