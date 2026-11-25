import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../environments/environment';
import { MaterialRate } from '../../../../../core/models/material-rate.model';
import { MaterialRateApi } from './material-rate-api';

const BASE = `${environment.apiUrl}/materials`;
const RATE: MaterialRate = {
  id: 3,
  materialId: 1,
  pricePerKg: 1800,
  validFrom: '2026-01-01',
  validTo: null,
};

describe('MaterialRateApi', () => {
  let api: MaterialRateApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MaterialRateApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { rates } of a material', () => {
    let result: MaterialRate[] | undefined;
    api.rates(1).subscribe((rates) => (result = rates));
    http.expectOne(`${BASE}/1/rates`).flush({ rates: [RATE] });
    expect(result).toEqual([RATE]);
  });

  it('should ask for the rate in force on a date with ?date=', () => {
    api.currentRate(1, '2026-10-15').subscribe();
    const request = http.expectOne((req) => req.url === `${BASE}/1/rates/current`);
    expect(request.request.params.get('date')).toBe('2026-10-15');
    request.flush(RATE);
  });
});
