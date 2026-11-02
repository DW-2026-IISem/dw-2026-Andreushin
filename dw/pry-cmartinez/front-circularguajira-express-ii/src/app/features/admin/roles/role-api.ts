import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiMessage } from '../../../core/models/api.model';
import { Role, RolePayload, RoleUpdatePayload } from '../../../core/models/role.model';

/** Contract of `/roles` in Express: lists wrapped as `{ roles }`, single items unwrapped. */
@Injectable({ providedIn: 'root' })
export class RoleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http.get<{ roles: Role[] }>(this.base).pipe(map((response) => response.roles));
  }

  get(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.base}/${id}`);
  }

  create(payload: RolePayload): Observable<Role> {
    return this.http.post<Role>(this.base, payload);
  }

  update(id: number, payload: Partial<RoleUpdatePayload>): Observable<Role> {
    return this.http.patch<Role>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: RoleUpdatePayload): Observable<Role> {
    return this.http.put<Role>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<Role> {
    return this.http.patch<Role>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
