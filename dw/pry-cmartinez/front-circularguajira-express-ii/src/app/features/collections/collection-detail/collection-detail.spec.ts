import { TestBed } from '@angular/core/testing';
import { Collection } from '../../../core/models/collection.model';
import { CollectionDetail } from './collection-detail';

const COLLECTION: Collection = {
  id: 7,
  recyclerId: 4,
  routeId: 5,
  collectedOn: '2026-10-14',
  totalNetKg: 151.13,
  totalAmount: 332486.5,
  status: 'active',
  weighings: [
    {
      id: 19,
      collectionId: 7,
      materialId: 3,
      rateId: 9,
      pricePerKg: 650,
      grossKg: 79.79,
      tareKg: 0.96,
      netKg: 78.83,
      amount: 51239.5,
      status: 'active',
    },
    {
      id: 20,
      collectionId: 7,
      materialId: 6,
      rateId: 18,
      pricePerKg: 3890,
      grossKg: 73.82,
      tareKg: 1.52,
      netKg: 72.3,
      amount: 281247,
      status: 'active',
    },
  ],
};

describe('CollectionDetail', () => {
  async function createDetail() {
    const fixture = TestBed.createComponent(CollectionDetail);
    fixture.componentRef.setInput('collection', COLLECTION);
    fixture.componentRef.setInput('materials', [
      { id: 3, name: 'Archivo', description: null, status: 'active' },
    ]);
    fixture.componentRef.setInput('recyclerName', 'Teodoro Valadez Rocha');
    fixture.componentRef.setInput('routeName', 'Manaure Salinas');
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('should show the header, one row per weighing and the stored total', async () => {
    const { element } = await createDetail();
    expect(element.textContent).toContain('Teodoro Valadez Rocha');
    expect(element.textContent).toContain('Manaure Salinas');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('332,486.50');
  });

  it('should resolve material names and fall back to the id', async () => {
    const { fixture, element } = await createDetail();
    expect(element.textContent).toContain('Archivo');
    expect(fixture.componentInstance.materialName()(6)).toBe('Material #6');
    expect(fixture.componentInstance.weighingCount()).toBe(2);
  });
});
