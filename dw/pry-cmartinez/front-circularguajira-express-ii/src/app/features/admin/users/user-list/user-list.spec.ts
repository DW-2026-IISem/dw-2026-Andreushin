import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';
import { User } from '../../../../core/models/user.model';
import { PROFILE } from '../../../../core/testing/session-fixtures';
import { signInAs } from '../../../../core/testing/session-fixtures';
import { UserList } from './user-list';

const API = environment.apiUrl;
const USERS: User[] = [
  { id: PROFILE.id, username: 'admin', email: 'admin@circularguajira.co', avatar: null, status: 'active' },
  { id: 4, username: 'planta', email: 'planta@circularguajira.co', avatar: null, status: 'active' },
];

describe('UserList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList() {
    const fixture = TestBed.createComponent(UserList);
    http.expectOne(`${API}/users`).flush({ users: USERS });
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  it('should not let the session user deactivate or delete itself', async () => {
    const { element } = await createList();
    const [own, other] = [...element.querySelectorAll('tbody tr')] as HTMLElement[];
    expect((own.querySelector('button[aria-label="Eliminar usuario"]') as HTMLButtonElement).disabled).toBe(true);
    expect((own.querySelector('button[aria-label="Dar de baja al usuario"]') as HTMLButtonElement).disabled).toBe(true);
    expect((other.querySelector('button[aria-label="Eliminar usuario"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('should show the effective permissions and the active roles of a user', async () => {
    const { fixture, list, element } = await createList();
    list.openPermissions(USERS[1]);
    http.expectOne(`${API}/users/4/permissions`).flush({
      permissions: [
        { resourceId: 9, method: 'GET', path: '/api/materials' },
        { resourceId: 33, method: 'GET', path: '/api/collections' },
      ],
    });
    http.expectOne(`${API}/role-users`).flush({
      assignments: [
        { id: 1, userId: 1, roleId: 1, status: 'active', role: { id: 1, name: 'ADMIN' } },
        { id: 4, userId: 4, roleId: 4, status: 'active', role: { id: 4, name: 'PLANTA' } },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(list.accessRoles()).toEqual(['PLANTA']);
    expect(list.access().map((row) => row.path)).toEqual(['/api/collections', '/api/materials']);
    expect(document.body.textContent).toContain('Permisos efectivos de planta');
    expect(element).toBeTruthy();
  });

  it('should POST a new user and PATCH an edited one', async () => {
    const { list } = await createList();
    list.openCreate();
    list.save({ username: 'nuevo', email: 'n@cg.co', avatar: null, password: 'Clave2026', status: 'active' });
    const post = http.expectOne(`${API}/users`);
    expect(post.request.method).toBe('POST');
    post.flush({ ...USERS[1], id: 9 });
    http.expectOne(`${API}/users`).flush({ users: USERS });

    list.openEdit(USERS[1]);
    list.save({ username: 'planta', email: 'p@cg.co', avatar: null });
    const patch = http.expectOne(`${API}/users/4`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ username: 'planta', email: 'p@cg.co', avatar: null });
    patch.flush(USERS[1]);
    http.expectOne(`${API}/users`).flush({ users: USERS });
  });
});
