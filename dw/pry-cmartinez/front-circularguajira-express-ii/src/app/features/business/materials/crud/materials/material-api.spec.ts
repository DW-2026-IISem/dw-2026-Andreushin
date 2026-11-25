import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../../environments/environment';
import { Material } from '../../../../../core/models/material.model';
import { MaterialApi } from './material-api';

const BASE = `${environment.apiUrl}/materials`;
const MATERIAL: Material = {
  id: 1,
  name: 'PET transparente',
  description: 'Botellas',
  status: 'active',
};
describe('MaterialApi', () => {
  let api: MaterialApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MaterialApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { materials } into Material[]', () => {
    let result: Material[] | undefined;
    api.list().subscribe((materials) => (result = materials));
    http.expectOne(BASE).flush({ materials: [MATERIAL] });
    expect(result).toEqual([MATERIAL]);
  });

  it('should return a single material without wrapper', () => {
    let result: Material | undefined;
    api.get(1).subscribe((material) => (result = material));
    http.expectOne(`${BASE}/1`).flush(MATERIAL);
    expect(result).toEqual(MATERIAL);
  });

  it('should POST to create and PATCH to update', () => {
    api.create({ name: 'Cartón', description: null, status: 'active' }).subscribe();
    const create = http.expectOne(BASE);
    expect(create.request.method).toBe('POST');
    create.flush({ ...MATERIAL, id: 2, name: 'Cartón' });

    api.update(2, { name: 'Cartón corrugado' }).subscribe();
    const update = http.expectOne(`${BASE}/2`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ name: 'Cartón corrugado' });
    update.flush({ ...MATERIAL, id: 2, name: 'Cartón corrugado' });
  });

  it('should deactivate with PATCH and remove with DELETE', () => {
    api.deactivate(1).subscribe();
    const deactivate = http.expectOne(`${BASE}/1/deactivate`);
    expect(deactivate.request.method).toBe('PATCH');
    deactivate.flush({ ...MATERIAL, status: 'inactive' });

    api.remove(1).subscribe();
    const remove = http.expectOne(`${BASE}/1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ message: 'Material eliminado' });
  });
});
