import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { CollectionPoint } from '../../../core/models/collection-point.model';
import { Route } from '../../../core/models/route.model';
import { CollectionPointList } from './collection-point-list';
import { signInAs } from '../../../core/testing/session-fixtures';

const POINTS_URL = `${environment.apiUrl}/collection-points`;
const ROUTES_URL = `${environment.apiUrl}/routes`;

const ROUTES: Route[] = [
  { id: 1, name: 'Ruta Centro', municipality: 'Riohacha', description: null, status: 'active' },
  { id: 2, name: 'Ruta Maicao', municipality: 'Maicao', description: null, status: 'active' },
  { id: 5, name: 'Ruta Uribia', municipality: 'Uribia', description: null, status: 'active' },
];
const POINTS: CollectionPoint[] = [
  { id: 1, routeId: 1, name: 'Tienda El Progreso', address: 'Calle 2 # 7-15', visitOrder: 1, status: 'active' },
  { id: 2, routeId: 1, name: 'Colegio Divina Pastora', address: 'Carrera 7 # 12-40', visitOrder: 2, status: 'active' },
  { id: 3, routeId: 2, name: 'Bodega La 15', address: 'Calle 15 # 4-20', visitOrder: 1, status: 'active' },
  { id: 4, routeId: 9, name: 'Parque Padilla', address: 'Calle 1', visitOrder: 1, status: 'active' },
];

describe('CollectionPointList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionPointList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    // Phase II: buttons are painted per grant; ADMIN has the whole real matrix.
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList() {
    const fixture = TestBed.createComponent(CollectionPointList);
    http.expectOne(POINTS_URL).flush({ points: POINTS });
    http.expectOne(ROUTES_URL).flush({ routes: ROUTES });
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  it('should load points and routes in parallel and show the route name, not the id', async () => {
    const { element } = await createList();
    const firstRow = element.querySelector('tbody tr') as HTMLElement;
    expect(firstRow.textContent).toContain('Ruta Centro');
    expect(element.querySelectorAll('tbody tr')).toHaveLength(4);
  });

  it('should flag a point whose route is no longer active', async () => {
    const { list, element } = await createList();
    expect(list.routeName()(9)).toBe('Ruta #9 (inactiva)');
    expect(list.routeIsActive()(9)).toBe(false);
    expect(element.textContent).toContain('Ruta #9 (inactiva)');
  });

  it('should count the active routes without points', async () => {
    const { list, element } = await createList();
    expect(list.routesWithoutPoints()).toBe(1);
    expect(element.textContent).toContain('1 rutas sin puntos');
  });

  it('should search by route name too', async () => {
    const { fixture, list } = await createList();
    list.filter.set('maicao');
    await fixture.whenStable();
    expect(list.visibleRows().map((point) => point.name)).toEqual(['Bodega La 15']);
  });

  it('should pass only the active routes to the form select', async () => {
    const { fixture, list } = await createList();
    list.openCreate();
    await fixture.whenStable();
    expect(list.routes().map((route) => route.id)).toEqual([1, 2, 5]);
  });

  it('should toast the 400 when the route became inactive before saving', async () => {
    const { list } = await createList();
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    list.openCreate();
    list.save({ routeId: 5, name: 'Punto nuevo', address: 'Calle 3', visitOrder: 1, status: 'active' });

    http.expectOne(POINTS_URL).flush({ message: 'La ruta 5 debe estar activa' }, { status: 400, statusText: 'Bad Request' });

    expect(list.dialogVisible()).toBe(true);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'No se pudo guardar', detail: 'La ruta 5 debe estar activa' }));
  });

  it('should PATCH the edited point keeping its numeric routeId and reload both lists', async () => {
    const { list } = await createList();
    list.openEdit(POINTS[2]);
    list.save({ routeId: 2, name: 'Bodega La 15', address: 'Calle 15 # 4-22', visitOrder: 1 });

    const update = http.expectOne(`${POINTS_URL}/3`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ routeId: 2, name: 'Bodega La 15', address: 'Calle 15 # 4-22', visitOrder: 1 });
    update.flush({ ...POINTS[2], address: 'Calle 15 # 4-22' });
    http.expectOne(POINTS_URL).flush({ points: POINTS });
    http.expectOne(ROUTES_URL).flush({ routes: ROUTES });
  });

  it('should show the load error in p-message', async () => {
    const fixture = TestBed.createComponent(CollectionPointList);
    // forkJoin fails as soon as one request fails and cancels the rest, so routes answer first.
    const points = http.expectOne(POINTS_URL);
    http.expectOne(ROUTES_URL).flush({ routes: ROUTES });
    points.flush({ message: 'Falta el token de acceso' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('p-message')?.textContent).toContain('Falta el token de acceso');
  });
});
