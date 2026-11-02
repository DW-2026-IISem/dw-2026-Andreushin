import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';
import { Resource } from '../../../../core/models/resource.model';
import { signInAs } from '../../../../core/testing/session-fixtures';
import { ResourceList } from './resource-list';

const API = environment.apiUrl;
const RESOURCES: Resource[] = [
  {
    id: 1,
    method: 'GET',
    path: '/api/recyclers',
    description: 'Listar recicladores',
    status: 'active',
  },
  {
    id: 3,
    method: 'POST',
    path: '/api/recyclers',
    description: 'Crear recicladores',
    status: 'active',
  },
  {
    id: 8,
    method: 'GET',
    path: '/api/materials',
    description: 'Listar materiales',
    status: 'active',
  },
];

describe('ResourceList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should count per method and combine the method filter with the search', async () => {
    const fixture = TestBed.createComponent(ResourceList);
    http.expectOne(`${API}/resources`).flush({ resources: RESOURCES });
    await fixture.whenStable();
    const list = fixture.componentInstance;

    expect(list.countsByMethod().get('GET')).toBe(2);
    expect(list.countsByMethod().get('POST')).toBe(1);
    list.methodFilter.set('GET');
    expect(list.visibleRows().map((row) => row.id)).toEqual([1, 8]);
    list.filter.set('recicl');
    expect(list.visibleRows().map((row) => row.id)).toEqual([1]);
  });
});
