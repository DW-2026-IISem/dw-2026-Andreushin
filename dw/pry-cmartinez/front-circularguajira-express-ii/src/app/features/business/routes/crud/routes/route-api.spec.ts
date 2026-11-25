import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../environments/environment';
import { Route } from '../../../../../core/models/route.model';
import { RouteApi } from './route-api';

const ROUTE: Route = {
  id: 1,
  name: 'Ruta Centro',
  municipality: 'Riohacha',
  description: null,
  status: 'active',
};
describe('RouteApi', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { routes }', () => {
    let result: Route[] | undefined;
    TestBed.inject(RouteApi)
      .list()
      .subscribe((routes) => (result = routes));
    http.expectOne(`${environment.apiUrl}/routes`).flush({ routes: [ROUTE] });
    expect(result).toEqual([ROUTE]);
  });
});
