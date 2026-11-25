import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { RoleUser } from '../../../../core/models/role-user.model';
import { RoleUserApi } from './role-user-api';

describe('RoleUserApi', () => {
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
});
