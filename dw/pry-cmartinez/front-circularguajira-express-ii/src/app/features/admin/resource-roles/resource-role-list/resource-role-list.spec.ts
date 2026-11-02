import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';
import { signInAs } from '../../../../core/testing/session-fixtures';
import { ResourceRoleList } from './resource-role-list';

const API = environment.apiUrl;
const ROLES = [
  { id: 1, name: 'ADMIN', description: null, status: 'active' },
  { id: 4, name: 'PLANTA', description: null, status: 'active' },
];
const RESOURCES = [
  {
    id: 1,
    method: 'GET',
    path: '/api/recyclers',
    description: 'Listar recicladores',
    status: 'active',
  },
  {
    id: 60,
    method: 'GET',
    path: '/api/resource-roles',
    description: 'Listar concesiones',
    status: 'active',
  },
];
const GRANTS = [
  { id: 1, roleId: 1, resourceId: 60, status: 'active', role: ROLES[0], resource: RESOURCES[1] },
  { id: 2, roleId: 1, resourceId: 1, status: 'active', role: ROLES[0], resource: RESOURCES[0] },
];

describe('ResourceRoleList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceRoleList],
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

  async function createList() {
    const fixture = TestBed.createComponent(ResourceRoleList);
    http.expectOne(`${API}/resource-roles`).flush({ grants: GRANTS });
    http.expectOne(`${API}/roles`).flush({ roles: ROLES });
    http.expectOne(`${API}/resources`).flush({ resources: RESOURCES });
    await fixture.whenStable();
    return {
      fixture,
      list: fixture.componentInstance,
      element: fixture.nativeElement as HTMLElement,
    };
  }

  it('should count grants per role and grant { roleId, resourceId }', async () => {
    const { list } = await createList();
    expect(list.countsByRole()).toEqual([
      { name: 'ADMIN', count: 2 },
      { name: 'PLANTA', count: 0 },
    ]);

    list.openGrant();
    list.selectedRole.set(list.roles()[0]);
    list.selectedResource.set(list.resources()[0]);
    expect(list.alreadyGranted()).toBe(true);

    list.selectedRole.set(list.roles()[1]);
    list.grant();
    const post = http.expectOne(`${API}/resource-roles`);
    expect(post.request.body).toEqual({ roleId: 4, resourceId: 1 });
    post.flush({ id: 3, roleId: 4, resourceId: 1, status: 'active' });
    http.expectOne(`${API}/resource-roles`).flush({ grants: GRANTS });
    http.expectOne(`${API}/roles`).flush({ roles: ROLES });
    http.expectOne(`${API}/resources`).flush({ resources: RESOURCES });
  });

  it('should not let ADMIN revoke its own RBAC administration grants', async () => {
    const { element } = await createList();
    const buttons = [
      ...element.querySelectorAll('button[aria-label="Retirar permiso"]'),
    ] as HTMLButtonElement[];
    // Row 1: ADMIN · GET /api/resource-roles (lock-out) · row 2: ADMIN · GET /api/recyclers.
    expect(buttons.map((button) => button.disabled)).toEqual([true, false]);
  });
});
