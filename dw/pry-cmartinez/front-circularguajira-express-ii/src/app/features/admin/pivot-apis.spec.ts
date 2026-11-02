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
});
