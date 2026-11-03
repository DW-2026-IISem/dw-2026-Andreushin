import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { MaterialRate } from '../../../core/models/material-rate.model';
import { signInAs } from '../../../core/testing/session-fixtures';
import { todayInColombia } from '../../../core/utils/weighing-math';
import { RateList } from './rate-list';

const API = `${environment.apiUrl}/materials`;
const MATERIALS = [
  { id: 1, name: 'Cartón', description: null, status: 'active' },
  { id: 3, name: 'Cobre', description: null, status: 'active' },
];
const RATES: MaterialRate[] = [
  { id: 9, materialId: 3, pricePerKg: '33000.00', validFrom: '2999-01-01', validTo: null },
  { id: 7, materialId: 3, pricePerKg: '31080.00', validFrom: '2026-09-20', validTo: '2998-12-31' },
  { id: 4, materialId: 3, pricePerKg: '29000.00', validFrom: '2026-01-01', validTo: '2026-09-19' },
];

describe('RateList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RateList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService],
    }).compileComponents();
    signInAs('FINANZAS');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function create(materialId?: string) {
    const fixture = TestBed.createComponent(RateList);
    if (materialId) fixture.componentRef.setInput('materialId', materialId);
    http.expectOne(API).flush({ materials: MATERIALS });
    await fixture.whenStable();
    return {
      fixture,
      list: fixture.componentInstance,
      element: fixture.nativeElement as HTMLElement,
    };
  }

  it('should open the material of the query string and classify its rates', async () => {
    const { fixture, list, element } = await create('3');
    http.expectOne(`${API}/3/rates`).flush({ rates: RATES });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(list.selected()?.name).toBe('Cobre');
    expect(RATES.map((rate) => list.status(rate))).toEqual(['future', 'current', 'closed']);
    expect(list.current()?.id).toBe(7);
    expect(element.querySelector('[data-testid="current-rate"]')?.textContent).toContain('31,080');
    expect(element.textContent).toContain('Nueva tarifa');
  });

  it('should POST the new rate for the selected material and reload the history', async () => {
    const { list } = await create();
    http.expectOne(`${API}/1/rates`).flush({ rates: [] });
    list.save({ pricePerKg: 470, validFrom: todayInColombia(), validTo: null });
    const post = http.expectOne(`${API}/1/rates`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      pricePerKg: 470,
      validFrom: todayInColombia(),
      validTo: null,
    });
    post.flush({
      id: 11,
      materialId: 1,
      pricePerKg: 470,
      validFrom: todayInColombia(),
      validTo: null,
    });
    http.expectOne(`${API}/1/rates`).flush({ rates: [] });
  });

  it('should hide «Nueva tarifa» from PLANTA, which only reads the history', async () => {
    signInAs('PLANTA');
    const { fixture, element } = await create();
    http.expectOne(`${API}/1/rates`).flush({ rates: [] });
    fixture.detectChanges();
    expect(element.textContent).not.toContain('Nueva tarifa');
  });
});
