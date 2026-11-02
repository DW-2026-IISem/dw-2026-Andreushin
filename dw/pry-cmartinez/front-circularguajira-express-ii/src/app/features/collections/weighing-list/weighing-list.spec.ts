import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Weighing } from '../../../core/models/weighing.model';
import { WeighingList } from './weighing-list';
import { signInAs } from '../../../core/testing/session-fixtures';

const API = environment.apiUrl;
const WEIGHINGS: Weighing[] = [
  { id: 19, collectionId: 7, materialId: 3, rateId: 9, pricePerKg: 650, grossKg: 79.79, tareKg: 0.96, netKg: 78.83, amount: 51239.5, status: 'active' },
  { id: 5, collectionId: 2, materialId: 1, rateId: 2, pricePerKg: 1290, grossKg: 40, tareKg: 1, netKg: 39, amount: 50310, status: 'active' },
];

describe('WeighingList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeighingList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    // Phase II: buttons are painted per grant; ADMIN has the whole real matrix.
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList() {
    const fixture = TestBed.createComponent(WeighingList);
    http.expectOne(`${API}/weighings`).flush({ weighings: WEIGHINGS });
    http.expectOne(`${API}/collections`).flush({
      collections: [
        { id: 7, recyclerId: 4, routeId: 5, collectedOn: '2026-10-14', totalNetKg: 0, totalAmount: 0, status: 'active' },
        { id: 2, recyclerId: 9, routeId: 5, collectedOn: '2026-09-26', totalNetKg: 0, totalAmount: 0, status: 'active' },
      ],
    });
    http.expectOne(`${API}/materials`).flush({
      materials: [
        { id: 1, name: 'PET', description: null, status: 'active' },
        { id: 3, name: 'Archivo', description: null, status: 'active' },
      ],
    });
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  it('should list the lines with collection and material resolved', async () => {
    const { element } = await createList();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('#7 · 2026-10-14');
    expect(element.textContent).toContain('Archivo');
  });

  it('should PATCH only gross and tare when editing', async () => {
    const { list } = await createList();
    list.openEdit(WEIGHINGS[0]);
    list.save({ collectionId: 7, materialId: 3, grossKg: 80, tareKg: 1 });

    const update = http.expectOne(`${API}/weighings/19`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ grossKg: 80, tareKg: 1 });
    update.flush({ ...WEIGHINGS[0], grossKg: 80, tareKg: 1, netKg: 79, amount: 51350 });
    http.expectOne(`${API}/weighings`).flush({ weighings: WEIGHINGS });
    http.expectOne(`${API}/collections`).flush({ collections: [] });
    http.expectOne(`${API}/materials`).flush({ materials: [] });
  });

  it('should POST the whole line when creating', async () => {
    const { list } = await createList();
    list.openCreate();
    list.save({ collectionId: 7, materialId: 1, grossKg: 12, tareKg: 0.4 });
    const create = http.expectOne(`${API}/weighings`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ collectionId: 7, materialId: 1, grossKg: 12, tareKg: 0.4 });
    create.flush({ ...WEIGHINGS[0], id: 30 });
    http.expectOne(`${API}/weighings`).flush({ weighings: WEIGHINGS });
    http.expectOne(`${API}/collections`).flush({ collections: [] });
    http.expectOne(`${API}/materials`).flush({ materials: [] });
  });

  it('should toast the 409 of a settled collection and keep the dialog open', async () => {
    const { list } = await createList();
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    list.openEdit(WEIGHINGS[1]);
    list.save({ collectionId: 2, materialId: 1, grossKg: 41, tareKg: 1 });
    http.expectOne(`${API}/weighings/5`).flush(
      { message: 'La recolección 2 está liquidada (liquidación 4); anula la liquidación para modificarla' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(list.dialogVisible()).toBe(true);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'No se pudo guardar' }));
  });
});
