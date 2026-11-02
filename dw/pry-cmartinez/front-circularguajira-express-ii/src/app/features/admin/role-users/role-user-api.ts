import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RoleUser, RoleUserPayload } from '../../../core/models/role-user.model';

/** Pivot `role_users`: the list comes as `{ assignments }`, NOT `{ role_users }`. */
@Injectable({ providedIn: 'root' })
export class RoleUserApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/role-users`;

  list(): Observable<RoleUser[]> {
    return this.http
      .get<{ assignments: RoleUser[] }>(this.base)
      .pipe(map((response) => response.assignments));
  }

  get(id: number): Observable<RoleUser> {
    return this.http.get<RoleUser>(`${this.base}/${id}`);
  }

  /** Assigns a role to a user. */
  create(payload: RoleUserPayload): Observable<RoleUser> {
    return this.http.post<RoleUser>(this.base, payload);
  }

  /** Withdraws the role (no physical delete for pivots). */
  deactivate(id: number): Observable<RoleUser> {
    return this.http.patch<RoleUser>(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: number): Observable<RoleUser> {
    return this.http.patch<RoleUser>(`${this.base}/${id}/reactivate`, {});
  }
}
