import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { Route } from '../../../core/models/route.model';
import { RouteList } from './route-list';
import { signInAs } from '../../../core/testing/session-fixtures';

const BASE = `${environment.apiUrl}/routes`;
const ROUTES: Route[] = [
  {
    id: 1,
    name: 'Ruta Centro',
    municipality: 'Riohacha',
    description: 'Zona comercial',
    status: 'active',
  },
  { id: 2, name: 'Ruta Maicao', municipality: 'Maicao', description: null, status: 'active' },
];

describe('RouteList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();
    // Phase II: buttons are painted per grant; ADMIN has the whole real matrix.
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList() {
    const fixture = TestBed.createComponent(RouteList);
    http.expectOne(BASE).flush({ routes: ROUTES });
    await fixture.whenStable();
    return {
      fixture,
      list: fixture.componentInstance,
      element: fixture.nativeElement as HTMLElement,
    };
  }

  it('should render the active routes with their municipality', async () => {
    const { element } = await createList();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('2 activas');
    expect(element.textContent).toContain('Maicao');
  });

  it('should filter by municipality without requests', async () => {
    const { fixture, list } = await createList();
    list.filter.set('riohacha');
    await fixture.whenStable();
    expect(list.visibleRows().map((route) => route.name)).toEqual(['Ruta Centro']);
    http.expectNone(BASE);
  });

  it('should toast the 409 when deleting a route that still has points', async () => {
    const { list } = await createList();
    const confirmation = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmation, 'confirm').mockImplementation((options: Confirmation) => {
      options.accept?.();
      return confirmation;
    });
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');

    list.remove(ROUTES[0]);
    http
      .expectOne(`${BASE}/1`)
      .flush(
        { message: 'La ruta tiene 2 punto(s) de recolección; elimínalos o desactiva la ruta' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'No se pudo eliminar',
        detail: 'La ruta tiene 2 punto(s) de recolección; elimínalos o desactiva la ruta',
      }),
    );
  });
});
