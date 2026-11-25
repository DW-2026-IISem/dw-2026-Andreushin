import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../environments/environment';
import { CollectionPoint } from '../../../../../core/models/collection-point.model';
import { CollectionPointApi } from './collection-point-api';

const POINT: CollectionPoint = {
  id: 4,
  routeId: 1,
  name: 'Tienda El Progreso',
  address: 'Calle 2 # 7-15',
  visitOrder: 1,
  status: 'active',
};

describe('CollectionPointApi', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { points } of one route', () => {
    let result: CollectionPoint[] | undefined;
    TestBed.inject(CollectionPointApi)
      .byRoute(1)
      .subscribe((points) => (result = points));
    http.expectOne(`${environment.apiUrl}/routes/1/points`).flush({ points: [POINT] });
    expect(result).toEqual([POINT]);
  });

  it('should unwrap { points } of /collection-points and send routeId as a number', () => {
    const api = TestBed.inject(CollectionPointApi);
    let result: CollectionPoint[] | undefined;
    api.list().subscribe((points) => (result = points));
    http.expectOne(`${environment.apiUrl}/collection-points`).flush({ points: [POINT] });
    expect(result).toEqual([POINT]);

    api
      .create({ routeId: 1, name: 'Nuevo', address: 'Calle 1', visitOrder: 2, status: 'active' })
      .subscribe();
    const create = http.expectOne(`${environment.apiUrl}/collection-points`);
    expect(create.request.method).toBe('POST');
    expect(typeof create.request.body.routeId).toBe('number');
    create.flush({ ...POINT, id: 5, visitOrder: 2 });
  });
});
