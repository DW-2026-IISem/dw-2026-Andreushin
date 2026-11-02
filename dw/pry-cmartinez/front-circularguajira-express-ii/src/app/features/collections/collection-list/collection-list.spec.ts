import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Collection } from '../../../core/models/collection.model';
import { CollectionList } from './collection-list';
import { signInAs } from '../../../core/testing/session-fixtures';

const API = environment.apiUrl;
const COLLECTIONS: Collection[] = [
  { id: 7, recyclerId: 4, routeId: 5, collectedOn: '2026-10-14', totalNetKg: 204.17, totalAmount: 363249.7, status: 'active', weighings: [] },
  { id: 3, recyclerId: 9, routeId: 1, collectedOn: '2026-10-02', totalNetKg: '50.00', totalAmount: '32500.00', status: 'active' },
];

describe('CollectionList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService, ConfirmationService],
    }).compileComponents();
    // Phase II: buttons are painted per grant; ADMIN has the whole real matrix.
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList() {
    const fixture = TestBed.createComponent(CollectionList);
    http.expectOne(`${API}/collections`).flush({ collections: COLLECTIONS });
    http.expectOne(`${API}/recyclers`).flush({ recyclers: [{ id: 4, name: 'Teodoro Valadez', status: 'active' }] });
    http.expectOne(`${API}/routes`).flush({ routes: [{ id: 5, name: 'Manaure Salinas', status: 'active' }] });
    http.expectOne(`${API}/materials`).flush({ materials: [{ id: 1, name: 'PET', description: null, status: 'active' }] });
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  it('should resolve recycler and route names and fall back to the id', async () => {
    const { element, list } = await createList();
    expect(element.textContent).toContain('Teodoro Valadez');
    expect(element.textContent).toContain('Manaure Salinas');
    expect(list.recyclerName()(9)).toBe('Reciclador #9');
  });

  it('should add the stored totals even when DECIMAL arrives as a string', async () => {
    const { list } = await createList();
    expect(list.totalAmount()).toBe(395749.7);
  });

  it('should toast the 409 when the collection is settled', async () => {
    const { list } = await createList();
    const confirmation = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmation, 'confirm').mockImplementation((options: Confirmation) => {
      options.accept?.();
      return confirmation;
    });
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');

    list.deactivate(COLLECTIONS[1]);
    http.expectOne(`${API}/collections/3/deactivate`).flush(
      { message: 'La recolección 3 está liquidada (liquidación 1); anula la liquidación para modificarla' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'No se pudo cancelar' }));
  });

  it('should open the detail dialog with the selected collection', async () => {
    const { fixture, list } = await createList();
    list.openDetail(COLLECTIONS[0]);
    await fixture.whenStable();
    expect(list.detailVisible()).toBe(true);
    expect(list.detailTitle()).toBe('Recolección #7');
  });

  it('should keep working for PLANTA without reading recyclers or routes (no 403)', async () => {
    signInAs('PLANTA');
    const fixture = TestBed.createComponent(CollectionList);
    http.expectOne(`${API}/collections`).flush({ collections: COLLECTIONS });
    http.expectNone(`${API}/recyclers`);
    http.expectNone(`${API}/routes`);
    http.expectOne(`${API}/materials`).flush({ materials: [] });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const row = element.querySelector('tbody tr') as HTMLElement;

    expect(row.textContent).toContain('Reciclador #4');
    expect(element.querySelector('a[href="/collections/new"]')).toBeNull();
    expect(row.querySelector('button[aria-label="Ver detalle de la recolección"]')).toBeTruthy();
    expect(row.querySelector('button[aria-label="Cancelar recolección"]')).toBeNull();
    expect(row.querySelector('button[aria-label="Eliminar recolección"]')).toBeNull();
  });
});
