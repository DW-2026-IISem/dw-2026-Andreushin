import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Material } from '../../../core/models/material.model';
import { MaterialList } from './material-list';
import { signInAs } from '../../../core/testing/session-fixtures';

const BASE = `${environment.apiUrl}/materials`;

const MATERIALS: Material[] = [
  { id: 2, name: 'Cartón', description: 'Cajas y empaques corrugados', status: 'active' },
  { id: 1, name: 'PET transparente', description: 'Botellas de bebidas', status: 'active' },
  { id: 3, name: 'Vidrio', description: null, status: 'active' },
];

describe('MaterialList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    // Phase II: buttons are painted per grant; ADMIN has the whole real matrix.
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList(rows: Material[] = MATERIALS) {
    const fixture = TestBed.createComponent(MaterialList);
    http.expectOne(BASE).flush({ materials: rows });
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  function acceptConfirmation(): void {
    const confirmation = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmation, 'confirm').mockImplementation((options: Confirmation) => {
      options.accept?.();
      return confirmation;
    });
  }

  it('should render the three row actions with a visible icon', async () => {
    const { element } = await createList();
    const row = element.querySelector('tbody tr') as HTMLElement;
    for (const label of ['Editar material', 'Dar de baja al material', 'Eliminar material']) {
      const button = row.querySelector(`button[aria-label="${label}"]`);
      expect(button?.querySelector('[data-pc-section="icon"], .pi')).toBeTruthy();
    }
  });

  it('should render one row per active material and the counter', async () => {
    const { element } = await createList();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(element.textContent).toContain('3 activos');
  });

  it('should show the load error in p-message with an empty table', async () => {
    const fixture = TestBed.createComponent(MaterialList);
    http.expectOne(BASE).flush({ message: 'Falta el token de acceso' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('p-message')?.textContent).toContain('Falta el token de acceso');
    expect(element.textContent).toContain('Sin materiales activos');
  });

  it('should filter by description without new requests', async () => {
    const { fixture, list, element } = await createList();
    list.filter.set('botellas');
    await fixture.whenStable();
    expect(list.visibleRows().map((row) => row.name)).toEqual(['PET transparente']);
    expect(element.textContent).toContain('1 de 3 coinciden con «botellas»');
    http.expectNone(BASE);
  });

  it('should show the no matches state when the filter finds nothing', async () => {
    const { fixture, list, element } = await createList();
    list.filter.set('aluminio');
    await fixture.whenStable();
    expect(element.textContent).toContain('Ningún material coincide con la búsqueda');
  });

  it('should POST a new material, close the dialog and reload', async () => {
    const { list } = await createList();
    list.openCreate();
    expect(list.title()).toBe('Nuevo material');
    list.save({ name: 'Chatarra', description: null, status: 'active' });

    const create = http.expectOne(BASE);
    expect(create.request.method).toBe('POST');
    create.flush({ id: 4, name: 'Chatarra', description: null, status: 'active' });
    http.expectOne(BASE).flush({ materials: [...MATERIALS, { id: 4, name: 'Chatarra', description: null, status: 'active' }] });

    expect(list.dialogVisible()).toBe(false);
    expect(list.rows()).toHaveLength(4);
  });

  it('should PATCH the edited material and send no status', async () => {
    const { list } = await createList();
    list.openEdit(MATERIALS[2]);
    expect(list.title()).toBe('Editar material');
    list.save({ name: 'Vidrio', description: 'Envases de vidrio' });

    const update = http.expectOne(`${BASE}/3`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ name: 'Vidrio', description: 'Envases de vidrio' });
    update.flush({ ...MATERIALS[2], description: 'Envases de vidrio' });
    http.expectOne(BASE).flush({ materials: MATERIALS });
  });

  it('should toast a duplicate name (409) and keep the dialog open', async () => {
    const { list } = await createList();
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    list.openCreate();
    list.save({ name: 'Cartón', description: null, status: 'active' });
    http.expectOne(BASE).flush({ message: 'Ya existe un registro con esos datos únicos' }, { status: 409, statusText: 'Conflict' });

    expect(list.dialogVisible()).toBe(true);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', detail: 'Ya existe un registro con esos datos únicos' }));
  });

  it('should deactivate after the confirmation and hide the material', async () => {
    const { list } = await createList();
    acceptConfirmation();
    list.deactivate(MATERIALS[2]);
    const deactivate = http.expectOne(`${BASE}/3/deactivate`);
    expect(deactivate.request.method).toBe('PATCH');
    deactivate.flush({ ...MATERIALS[2], status: 'inactive' });
    http.expectOne(BASE).flush({ materials: MATERIALS.slice(0, 2) });
    expect(list.rows().map((row) => row.name)).not.toContain('Vidrio');
  });

  it('should DELETE after the confirmation and toast a 409 when it has rates', async () => {
    const { list } = await createList();
    acceptConfirmation();
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    list.remove(MATERIALS[1]);

    const remove = http.expectOne(`${BASE}/1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(
      { message: 'El registro tiene datos relacionados; desactívalo en lugar de eliminarlo' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'No se pudo eliminar' }));
  });
});
