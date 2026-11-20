import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ResourceRole } from '../../core/models/resource-role.model';
import { RoleUser } from '../../core/models/role-user.model';
import { ResourceRoleApi } from './resource-roles/resource-role-api';
import { RoleUserApi } from './role-users/role-user-api';

describe('Pivot APIs', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should unwrap { assignments } (not { role_users })', () => {
    const assignment: RoleUser = { id: 1, userId: 5, roleId: 1, status: 'active' };
    let result: RoleUser[] | undefined;
    TestBed.inject(RoleUserApi)
      .list()
      .subscribe((assignments) => (result = assignments));

    http.expectOne(`${environment.apiUrl}/role-users`).flush({ assignments: [assignment] });

    expect(result).toEqual([assignment]);
  });

  it('should unwrap { grants } and send the roleId/resourceId filters', () => {
    const grant: ResourceRole = { id: 7, roleId: 2, resourceId: 3, status: 'active' };
    let result: ResourceRole[] | undefined;
    TestBed.inject(ResourceRoleApi)
      .list({ roleId: 2, resourceId: 3 })
      .subscribe((grants) => (result = grants));

    const request = http.expectOne(
      (req) =>
        req.url === `${environment.apiUrl}/resource-roles` && req.params.get('roleId') === '2',
    );
    expect(request.request.params.get('resourceId')).toBe('3');
    request.flush({ grants: [grant] });

    expect(result).toEqual([grant]);
  });

  it('should POST { roleId, resourceIds } to /reconcile and unwrap { result }', () => {
    const result = { roleId: 2, activated: 1, deactivated: 2, totalActive: 3 };
    let answer: unknown;
    TestBed.inject(ResourceRoleApi)
      .reconcile(2, [11, 12, 13])
      .subscribe((value) => (answer = value));

    const request = http.expectOne(`${environment.apiUrl}/resource-roles/reconcile`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ roleId: 2, resourceIds: [11, 12, 13] });
    request.flush({ message: 'Permisos del rol actualizados', result });

    expect(answer).toEqual(result);
  });

  it('should send an empty resourceIds as it is (it means revoke everything)', () => {
    TestBed.inject(ResourceRoleApi).reconcile(2, []).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/resource-roles/reconcile`);
    expect(request.request.body).toEqual({ roleId: 2, resourceIds: [] });
    request.flush({
      message: 'ok',
      result: { roleId: 2, activated: 0, deactivated: 1, totalActive: 0 },
    });
  });

  it('should fail with a readable error when the reconcile answer has no result', () => {
    let failure: unknown;
    TestBed.inject(ResourceRoleApi)
      .reconcile(2, [1])
      .subscribe({ error: (error: unknown) => (failure = error) });

    http.expectOne(`${environment.apiUrl}/resource-roles/reconcile`).flush({ message: 'ok' });

    expect((failure as Error).message).toContain('falta result');
  });

  it('should fail with a readable error when the grants wrapper is missing', () => {
    let failure: unknown;
    TestBed.inject(ResourceRoleApi)
      .list({ roleId: 2 })
      .subscribe({ error: (error: unknown) => (failure = error) });

    http
      .expectOne((req) => req.url === `${environment.apiUrl}/resource-roles`)
      .flush({ resource_roles: [] });

    expect((failure as Error).message).toContain('falta grants');
  });
});
