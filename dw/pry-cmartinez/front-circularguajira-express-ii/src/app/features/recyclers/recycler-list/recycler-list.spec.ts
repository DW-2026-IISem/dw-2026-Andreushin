import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Recycler } from '../../../core/models/recycler.model';
import { RecyclerList } from './recycler-list';

const BASE = `${environment.apiUrl}/recyclers`;

const RECYCLERS: Recycler[] = [
  { id: 1, name: 'Asociación Wayuu Recicla', documentNumber: '900123456-7', recyclerType: 'organization', phone: '3001112233', email: 'wayuu@correo.co', address: 'Riohacha', status: 'active' },
  { id: 2, name: 'Juan Epieyú', documentNumber: '1122334455', recyclerType: 'independent', phone: '3104445566', email: null, address: 'Maicao', status: 'active' },
  { id: 3, name: 'Recicladora del Sur', documentNumber: '800765432', recyclerType: 'organization', phone: '3157778899', email: null, address: 'Barrio Sur, Uribia', status: 'active' },
];

describe('RecyclerList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecyclerList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList(rows: Recycler[] = RECYCLERS) {
    const fixture = TestBed.createComponent(RecyclerList);
    http.expectOne(BASE).flush({ recyclers: rows });
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  /** Spy that runs `accept()` right away; `confirm` returns the service because it chains. */
  function acceptConfirmation(): void {
    const confirmation = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmation, 'confirm').mockImplementation((options: Confirmation) => {
      options.accept?.();
      return confirmation;
    });
  }

  it('should render one table row per active recycler and the counter', async () => {
    const { element } = await createList();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(element.textContent).toContain('3 activos');
    expect(element.textContent).toContain('Organización');
  });

  it('should show the backend error in a p-message and leave the table empty', async () => {
    const fixture = TestBed.createComponent(RecyclerList);
    http
      .expectOne(BASE)
      .flush({ message: 'Falta el token de acceso (Authorization: Bearer <token>)' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('p-message')?.textContent).toContain('Falta el token de acceso');
    expect(fixture.componentInstance.rows()).toEqual([]);
    expect(element.textContent).toContain('Sin recicladores activos');
  });

  it('should filter locally without new requests', async () => {
    const { fixture, list, element } = await createList();
    list.filter.set('sur');
    await fixture.whenStable();

    expect(list.visibleRows().map((row) => row.name)).toEqual(['Recicladora del Sur']);
    expect(element.textContent).toContain('1 de 3 coinciden con «sur»');
    http.expectNone(BASE);
  });

  it('should open the dialog in create mode with a new reset key', async () => {
    const { list } = await createList();
    list.openCreate();

    expect(list.dialogVisible()).toBe(true);
    expect(list.editing()).toBeNull();
    expect(list.title()).toBe('Nuevo reciclador');
    expect(list.resetKey()).toBe(1);
  });

  it('should POST a new recycler, close the dialog and reload', async () => {
    const { list } = await createList();
    list.openCreate();
    list.save({ name: 'Cooperativa Cabo de la Vela', documentNumber: '901555666', recyclerType: 'organization', phone: '3009990000', status: 'active' });

    const create = http.expectOne(BASE);
    expect(create.request.method).toBe('POST');
    expect(create.request.body.status).toBe('active');
    create.flush({ ...RECYCLERS[0], id: 4, name: 'Cooperativa Cabo de la Vela' });
    http.expectOne(BASE).flush({ recyclers: RECYCLERS });

    expect(list.dialogVisible()).toBe(false);
  });

  it('should PATCH the edited recycler and send no status', async () => {
    const { list } = await createList();
    list.openEdit(RECYCLERS[1]);
    expect(list.title()).toBe('Editar reciclador');
    list.save({ name: 'Juan Epieyú', documentNumber: '1122334455', recyclerType: 'independent', phone: '3200000000' });

    const update = http.expectOne(`${BASE}/2`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).not.toHaveProperty('status');
    update.flush({ ...RECYCLERS[1], phone: '3200000000' });
    http.expectOne(BASE).flush({ recyclers: RECYCLERS });
  });

  it('should keep the dialog open and toast the error when saving fails', async () => {
    const { list } = await createList();
    const messages = TestBed.inject(MessageService);
    const add = vi.spyOn(messages, 'add');
    list.openCreate();
    list.save({ name: 'Duplicado', documentNumber: '900123456-7', recyclerType: 'organization', phone: '3001112233', status: 'active' });

    http.expectOne(BASE).flush({ message: 'Ya existe un reciclador con ese documento' }, { status: 409, statusText: 'Conflict' });

    expect(list.dialogVisible()).toBe(true);
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'No se pudo guardar', detail: 'Ya existe un reciclador con ese documento' }),
    );
  });

  it('should call deactivate after the confirmation is accepted', async () => {
    const { list } = await createList();
    acceptConfirmation();
    list.deactivate(RECYCLERS[0]);

    const deactivate = http.expectOne(`${BASE}/1/deactivate`);
    expect(deactivate.request.method).toBe('PATCH');
    deactivate.flush({ ...RECYCLERS[0], status: 'inactive' });
    http.expectOne(BASE).flush({ recyclers: RECYCLERS.slice(1) });

    expect(list.rows()).toHaveLength(2);
  });

  it('should DELETE after the confirmation is accepted', async () => {
    const { list } = await createList();
    acceptConfirmation();
    list.remove(RECYCLERS[2]);

    const remove = http.expectOne(`${BASE}/3`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ message: 'Reciclador eliminado' });
    http.expectOne(BASE).flush({ recyclers: RECYCLERS.slice(0, 2) });

    expect(list.rows()).toHaveLength(2);
  });

  it('should not call the API when the confirmation is rejected', async () => {
    const { list } = await createList();
    const confirmation = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmation, 'confirm').mockImplementation((options: Confirmation) => {
      options.reject?.();
      return confirmation;
    });

    list.remove(RECYCLERS[0]);
    list.deactivate(RECYCLERS[0]);

    http.expectNone(`${BASE}/1`);
    http.expectNone(`${BASE}/1/deactivate`);
  });
});
