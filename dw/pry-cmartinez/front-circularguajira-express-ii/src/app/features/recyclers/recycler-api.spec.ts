import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Recycler } from '../../core/models/recycler.model';
import { RecyclerApi } from './recycler-api';

const BASE = `${environment.apiUrl}/recyclers`;

const RECYCLER: Recycler = {
  id: 1,
  name: 'Asociación Wayuu Recicla',
  documentNumber: '900123456',
  recyclerType: 'organization',
  phone: '3001234567',
  email: null,
  address: 'Riohacha',
  status: 'active',
};

describe('RecyclerApi', () => {
  let api: RecyclerApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RecyclerApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { recyclers } into Recycler[]', () => {
    let result: Recycler[] | undefined;
    api.list().subscribe((recyclers) => (result = recyclers));

    const request = http.expectOne(BASE);
    expect(request.request.method).toBe('GET');
    request.flush({ recyclers: [RECYCLER] });

    expect(result).toEqual([RECYCLER]);
  });

  it('should return a single recycler as it comes (no wrapper)', () => {
    let result: Recycler | undefined;
    api.get(1).subscribe((recycler) => (result = recycler));

    http.expectOne(`${BASE}/1`).flush(RECYCLER);

    expect(result).toEqual(RECYCLER);
  });

  it('should build URLs from environment.apiUrl (no trailing slash)', () => {
    expect(environment.apiUrl.endsWith('/api')).toBe(true);
    api.list().subscribe();
    http.expectOne('http://localhost:4000/api/recyclers').flush({ recyclers: [] });
  });

  it('should deactivate with PATCH /:id/deactivate and remove with DELETE', () => {
    api.deactivate(1).subscribe();
    const deactivate = http.expectOne(`${BASE}/1/deactivate`);
    expect(deactivate.request.method).toBe('PATCH');
    deactivate.flush({ ...RECYCLER, status: 'inactive' });

    api.remove(1).subscribe();
    const remove = http.expectOne(`${BASE}/1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ message: 'Reciclador eliminado' });
  });
});
