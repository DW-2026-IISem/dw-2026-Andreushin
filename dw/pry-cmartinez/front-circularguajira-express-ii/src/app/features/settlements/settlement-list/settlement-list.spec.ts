import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Settlement } from '../../../core/models/settlement.model';
import { SettlementList } from './settlement-list';
import { signInAs } from '../../../core/testing/session-fixtures';

const API = environment.apiUrl;
const SETTLEMENTS: Settlement[] = [
  { id: 4, collectionId: 2, recyclerId: 9, settledAt: '2026-10-14T18:09:05.000Z', totalNetKg: 178.76, totalAmount: '80582.90', lineCount: 3, status: 'issued', notes: null },
  { id: 1, collectionId: 3, recyclerId: 9, settledAt: '2026-10-14T18:09:05.000Z', totalNetKg: 135.64, totalAmount: 1349673.8, lineCount: 3, status: 'issued', notes: 'Pago en bodega' },
];
const COLLECTIONS = [
  { id: 7, recyclerId: 4, routeId: 5, collectedOn: '2026-10-14', totalNetKg: 204.17, totalAmount: 363249.7, status: 'active', weighings: [] },
  { id: 3, recyclerId: 9, routeId: 1, collectedOn: '2026-09-20', totalNetKg: 135.64, totalAmount: 1349673.8, status: 'active' },
  { id: 2, recyclerId: 9, routeId: 5, collectedOn: '2026-09-26', totalNetKg: 178.76, totalAmount: 80582.9, status: 'active' },
];

describe('SettlementList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettlementList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    // Phase II: buttons are painted per grant; ADMIN has the whole real matrix.
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushLoad(settlements = SETTLEMENTS): void {
    http.expectOne(`${API}/settlements`).flush({ settlements });
    http.expectOne(`${API}/collections`).flush({ collections: COLLECTIONS });
    http.expectOne(`${API}/recyclers`).flush({ recyclers: [{ id: 4, name: 'Teodoro Valadez' }, { id: 9, name: 'Asociación Hinojosa' }] });
    http.expectOne(`${API}/materials`).flush({ materials: [{ id: 3, name: 'Archivo' }] });
  }

  async function createList() {
    const fixture = TestBed.createComponent(SettlementList);
    flushLoad();
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  it('should list the issued settlements and add their totals as numbers', async () => {
    const { element, list } = await createList();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('Asociación Hinojosa');
    expect(list.settledAmount()).toBe(1430256.7);
  });

  it('should offer only the collections without an issued settlement', async () => {
    const { list } = await createList();
    expect(list.pending().map((collection) => collection.id)).toEqual([7]);
    expect(list.pendingOptions()[0].label).toBe('#7 · 2026-10-14 · Teodoro Valadez');
  });

  it('should POST collectionId and notes to settle and reload', async () => {
    const { list } = await createList();
    list.openCreate();
    list.save({ collectionId: 7, notes: 'Pago en efectivo' });
    const create = http.expectOne(`${API}/settlements`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ collectionId: 7, notes: 'Pago en efectivo' });
    create.flush({ ...SETTLEMENTS[0], id: 5, collectionId: 7 });
    flushLoad([{ ...SETTLEMENTS[0], id: 5, collectionId: 7 }, ...SETTLEMENTS]);
    expect(list.dialogVisible()).toBe(false);
    expect(list.pending()).toEqual([]);
  });

  it('should send ONLY the notes when editing', async () => {
    const { list } = await createList();
    list.openNotes(SETTLEMENTS[1]);
    list.save({ collectionId: 3, notes: 'Pagado con transferencia' });
    const update = http.expectOne(`${API}/settlements/1`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ notes: 'Pagado con transferencia' });
    update.flush({ ...SETTLEMENTS[1], notes: 'Pagado con transferencia' });
    flushLoad();
  });

  it('should toast the 409 when the collection is already settled', async () => {
    const { list } = await createList();
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    list.openCreate();
    list.save({ collectionId: 3, notes: null });
    http.expectOne(`${API}/settlements`).flush(
      { message: 'La recolección 3 ya está liquidada (liquidación 1)' },
      { status: 409, statusText: 'Conflict' },
    );
    expect(list.dialogVisible()).toBe(true);
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'No se pudo liquidar', detail: 'La recolección 3 ya está liquidada (liquidación 1)' }));
  });

  it('should open the verification report', async () => {
    const { list } = await createList();
    list.verify(SETTLEMENTS[1]);
    http.expectOne(`${API}/settlements/1/verify`).flush({
      settlementId: 1, status: 'issued', collectionId: 3, collectedOn: '2026-09-20', consistent: true,
      stored: { totalNetKg: 135.64, totalAmount: 1349673.8, lineCount: 3 },
      recomputed: { totalNetKg: 135.64, totalAmount: 1349673.8, lineCount: 3 },
      lines: [],
    });
    expect(list.verifyVisible()).toBe(true);
    expect(list.verification()?.consistent).toBe(true);
  });

  it('should void after the confirmation and reopen the collection', async () => {
    const { list } = await createList();
    const confirmation = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmation, 'confirm').mockImplementation((options: Confirmation) => {
      options.accept?.();
      return confirmation;
    });
    list.voidSettlement(SETTLEMENTS[1]);
    const voidRequest = http.expectOne(`${API}/settlements/1/void`);
    expect(voidRequest.request.method).toBe('PATCH');
    voidRequest.flush({ ...SETTLEMENTS[1], status: 'voided' });
    flushLoad(SETTLEMENTS.slice(0, 1));
    expect(list.pending().map((collection) => collection.id)).toEqual([7, 3]);
  });

  it('should ask for confirmation when the row button «Anular liquidación» is clicked', async () => {
    const { element } = await createList();
    const confirm = vi.spyOn(TestBed.inject(ConfirmationService), 'confirm');
    const button = element.querySelector('tbody tr button[aria-label="Anular liquidación"]') as HTMLButtonElement;
    button.click();
    // `void(...)` in a template is the JS operator, not the method: the click must reach voidSettlement.
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Anular liquidación' }));
  });
});
