import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { MaterialRate } from '../../../core/models/material-rate.model';
import { CollectionForm } from './collection-form';

const API = environment.apiUrl;
const RATE_PET: MaterialRate = { id: 3, materialId: 1, pricePerKg: 1800, validFrom: '2026-10-01', validTo: null };

describe('CollectionForm', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionForm],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createForm() {
    const fixture = TestBed.createComponent(CollectionForm);
    http.expectOne(`${API}/recyclers`).flush({ recyclers: [{ id: 4, name: 'Teodoro Valadez', status: 'active' }] });
    http.expectOne(`${API}/routes`).flush({ routes: [{ id: 5, name: 'Manaure Salinas', status: 'active' }] });
    http.expectOne(`${API}/materials`).flush({
      materials: [
        { id: 1, name: 'PET', description: null, status: 'active' },
        { id: 3, name: 'Archivo', description: null, status: 'active' },
      ],
    });
    await fixture.whenStable();
    return { fixture, form: fixture.componentInstance };
  }

  function rateRequest(materialId: number) {
    return http.expectOne((req) => req.url === `${API}/materials/${materialId}/rates/current`);
  }

  it('should load recyclers, routes and materials in parallel', async () => {
    const { form } = await createForm();
    expect(form.recyclers()).toHaveLength(1);
    expect(form.routes()).toHaveLength(1);
    expect(form.materials()).toHaveLength(2);
  });

  it('should not add a line without material or with gross <= tare', async () => {
    const { form } = await createForm();
    form.addLine();
    expect(form.error()).toBe('Selecciona un material.');

    form.selectedMaterialId.set(1);
    form.grossKg.set(5);
    form.tareKg.set(5);
    form.addLine();
    expect(form.error()).toContain('debe ser mayor que la tara');
    expect(form.lines()).toEqual([]);
  });

  it('should only READ the rate when a line is added: the draft writes nothing', async () => {
    const { form } = await createForm();
    form.selectedMaterialId.set(1);
    form.grossKg.set(10.5);
    form.tareKg.set(0.5);
    form.addLine();

    const rate = rateRequest(1);
    expect(rate.request.method).toBe('GET');
    expect(rate.request.params.get('date')).toBe(form.collectedOn());
    rate.flush(RATE_PET);

    expect(form.lines()).toEqual([{ materialId: 1, grossKg: 10.5, tareKg: 0.5 }]);
    http.expectNone((req) => req.method !== 'GET');
  });

  it('should preview net and amount and update the totals when lines change', async () => {
    const { form } = await createForm();
    form.selectedMaterialId.set(1);
    form.grossKg.set(10.5);
    form.tareKg.set(0.5);
    form.addLine();
    rateRequest(1).flush(RATE_PET);

    form.selectedMaterialId.set(1);
    form.grossKg.set(5);
    form.tareKg.set(0);
    form.addLine(); // rate already known: no new request

    expect(form.previews()).toEqual([
      { netKg: 10, amount: 18000 },
      { netKg: 5, amount: 9000 },
    ]);
    expect(form.totals()).toEqual({ netKg: 15, amount: 27000 });

    form.removeLine(0);
    expect(form.totals()).toEqual({ netKg: 5, amount: 9000 });
  });

  it('should show the error and not add the line when there is no rate in force', async () => {
    const { form } = await createForm();
    form.selectedMaterialId.set(3);
    form.grossKg.set(10);
    form.addLine();
    rateRequest(3).flush(
      { message: 'No hay tarifa vigente para el material 3 en 2026-11-02' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(form.error()).toBe('No hay tarifa vigente para el material 3 en 2026-11-02');
    expect(form.lines()).toEqual([]);
  });

  it('should POST only recycler, route, date and gross/tare (no prices) and go to the list', async () => {
    const { form } = await createForm();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    form.recyclerId.set(4);
    form.routeId.set(5);
    form.selectedMaterialId.set(1);
    form.grossKg.set(10.5);
    form.tareKg.set(0.5);
    form.addLine();
    rateRequest(1).flush(RATE_PET);

    form.save();
    const create = http.expectOne(`${API}/collections`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({
      recyclerId: 4,
      routeId: 5,
      collectedOn: form.collectedOn(),
      weighings: [{ materialId: 1, grossKg: 10.5, tareKg: 0.5 }],
    });
    create.flush({ id: 9, recyclerId: 4, routeId: 5, collectedOn: form.collectedOn(), totalNetKg: 10, totalAmount: 18000, status: 'active' });

    expect(navigate).toHaveBeenCalledWith(['/collections']);
  });

  it('should keep the draft and show the backend error when the transaction fails', async () => {
    const { form } = await createForm();
    form.recyclerId.set(4);
    form.routeId.set(5);
    form.selectedMaterialId.set(1);
    form.grossKg.set(10);
    form.addLine();
    rateRequest(1).flush(RATE_PET);

    form.save();
    http
      .expectOne(`${API}/collections`)
      .flush({ message: 'No hay tarifa vigente para el material 1 en 2026-11-02' }, { status: 404, statusText: 'Not Found' });

    expect(form.error()).toContain('No hay tarifa vigente');
    expect(form.lines()).toHaveLength(1);
    expect(form.saving()).toBe(false);
  });

  it('should require recycler and route before saving', async () => {
    const { form } = await createForm();
    form.save();
    expect(form.error()).toBe('Selecciona un reciclador activo.');
    form.recyclerId.set(4);
    form.save();
    expect(form.error()).toBe('Selecciona una ruta activa.');
    form.routeId.set(5);
    form.save();
    expect(form.error()).toBe('La recolección requiere al menos un pesaje.');
  });
});
