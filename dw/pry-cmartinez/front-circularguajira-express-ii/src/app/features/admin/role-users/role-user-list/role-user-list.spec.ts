import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfirmationService, MessageService } from 'primeng/api';
import { environment } from '../../../../../environments/environment';
import { PROFILE, signInAs } from '../../../../core/testing/session-fixtures';
import { RoleUserList } from './role-user-list';

const API = environment.apiUrl;
const USERS = [
  { id: PROFILE.id, username: 'admin', email: 'admin@circularguajira.co', avatar: null, status: 'active' },
  { id: 4, username: 'planta', email: 'planta@circularguajira.co', avatar: null, status: 'active' },
];
const ROLES = [
  { id: 1, name: 'ADMIN', description: null, status: 'active' },
  { id: 5, name: 'FINANZAS', description: null, status: 'active' },
];
const ASSIGNMENTS = [
  { id: 1, userId: PROFILE.id, roleId: 1, status: 'active', user: USERS[0], role: ROLES[0] },
  { id: 4, userId: 4, roleId: 5, status: 'active', user: USERS[1], role: ROLES[1] },
];

describe('RoleUserList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleUserList],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService, ConfirmationService],
    }).compileComponents();
    signInAs('ADMIN');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function createList() {
    const fixture = TestBed.createComponent(RoleUserList);
    http.expectOne(`${API}/role-users`).flush({ assignments: ASSIGNMENTS });
    http.expectOne(`${API}/users`).flush({ users: USERS });
    http.expectOne(`${API}/roles`).flush({ roles: ROLES });
    await fixture.whenStable();
    return { fixture, list: fixture.componentInstance, element: fixture.nativeElement as HTMLElement };
  }

  it('should filter by user and by role', async () => {
    const { list } = await createList();
    list.userFilter.set(list.users()[1]);
    expect(list.visibleRows().map((row) => row.id)).toEqual([4]);
    list.userFilter.set(null);
    list.roleFilter.set(list.roles()[0]);
    expect(list.visibleRows().map((row) => row.id)).toEqual([1]);
  });

  it('should block a duplicated pair and POST a new one', async () => {
    const { list } = await createList();
    list.openAssign();
    list.selectedUser.set(list.users()[1]);
    list.selectedRole.set(list.roles()[1]);
    expect(list.alreadyAssigned()).toBe(true);
    expect(list.canSave()).toBe(false);

    list.selectedRole.set(list.roles()[0]);
    list.assign();
    const post = http.expectOne(`${API}/role-users`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ userId: 4, roleId: 1 });
    post.flush({ id: 9, userId: 4, roleId: 1, status: 'active' });
    http.expectOne(`${API}/role-users`).flush({ assignments: ASSIGNMENTS });
    http.expectOne(`${API}/users`).flush({ users: USERS });
    http.expectOne(`${API}/roles`).flush({ roles: ROLES });
  });

  it('should not let the session user retire its own role', async () => {
    const { element } = await createList();
    const buttons = [...element.querySelectorAll('button[aria-label="Retirar rol"]')] as HTMLButtonElement[];
    expect(buttons.map((button) => button.disabled)).toEqual([true, false]);
  });
});
