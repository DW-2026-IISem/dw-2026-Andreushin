import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Dashboard } from './dashboard';
import { signInAs } from '../../core/testing/session-fixtures';

const API = environment.apiUrl;

describe('Dashboard', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    // Phase II: buttons are painted per grant; ADMIN has the whole real matrix.
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushAll(collections: object[]): void {
    http.expectOne(`${API}/recyclers`).flush({
      recyclers: [
        { id: 4, name: 'Teodoro Valadez' },
        { id: 9, name: 'Asociación Orta' },
      ],
    });
    http.expectOne(`${API}/materials`).flush({ materials: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    http.expectOne(`${API}/collections`).flush({ collections });
    http.expectOne(`${API}/settlements`).flush({
      settlements: [
        { id: 1, collectionId: 3, status: 'issued' },
        { id: 2, collectionId: 5, status: 'voided' },
      ],
    });
  }

  const COLLECTIONS = [
    {
      id: 3,
      recyclerId: 9,
      collectedOn: '2026-09-20',
      totalNetKg: '100.00',
      totalAmount: '1000.50',
      status: 'active',
    },
    {
      id: 5,
      recyclerId: 9,
      collectedOn: '2026-09-21',
      totalNetKg: 50,
      totalAmount: 500,
      status: 'active',
    },
    {
      id: 7,
      recyclerId: 4,
      collectedOn: '2026-10-14',
      totalNetKg: 20.25,
      totalAmount: 2000,
      status: 'active',
    },
  ];

  it('should query the API once with four parallel requests and derive the KPIs', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    flushAll(COLLECTIONS);
    await fixture.whenStable();
    const dashboard = fixture.componentInstance;

    expect(dashboard.recyclers()).toHaveLength(2);
    expect(dashboard.materials()).toHaveLength(3);
    expect(dashboard.collectedAmount()).toBe(3500.5);
    expect(dashboard.collectedKg()).toBe(170.25);
  });

  it('should count as pending the collections without an ISSUED settlement', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    flushAll(COLLECTIONS);
    await fixture.whenStable();
    const dashboard = fixture.componentInstance;

    // #3 is issued; #5 only has a voided settlement, so it is still pending.
    expect(dashboard.unsettled().map((collection) => collection.id)).toEqual([5, 7]);
    expect(dashboard.pendingAmount()).toBe(2500);
  });

  it('should order the latest collections by date, newest first', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    flushAll(COLLECTIONS);
    await fixture.whenStable();
    expect(
      fixture.componentInstance.latestCollections().map((collection) => collection.id),
    ).toEqual([7, 5, 3]);
  });

  it('should recalculate the indicators when the data is reloaded', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    flushAll(COLLECTIONS);
    await fixture.whenStable();
    fixture.componentInstance.load();
    flushAll(COLLECTIONS.slice(0, 1));
    await fixture.whenStable();
    expect(fixture.componentInstance.collectedAmount()).toBe(1000.5);
    expect(fixture.componentInstance.unsettled()).toEqual([]);
  });

  it('should only read what PLANTA may read and hide the cards it cannot compute', async () => {
    signInAs('PLANTA');
    const fixture = TestBed.createComponent(Dashboard);
    http.expectNone(`${API}/recyclers`);
    http.expectNone(`${API}/settlements`);
    http.expectOne(`${API}/materials`).flush({ materials: [{ id: 1 }] });
    http.expectOne(`${API}/collections`).flush({ collections: COLLECTIONS });
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-kpi="recyclers"]')).toBeNull();
    expect(element.querySelector('[data-kpi="collections"]')).toBeTruthy();
    expect(element.textContent).not.toContain('Recolecciones sin liquidar');
    expect(element.textContent).not.toContain('sin liquidar');
  });
});
