import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiMessage } from '../../../core/models/api.model';
import { EffectivePermission } from '../../../core/models/auth.model';
import {
  ChangePasswordPayload,
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from '../../../core/models/user.model';

/** Contract of `features/auth/users`: `{ users }`, items unwrapped and never with `password`. */
@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  list(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(this.base).pipe(map((response) => response.users));
  }

  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(payload: UserCreatePayload): Observable<User> {
    return this.http.post<User>(this.base, payload);
  }

  update(id: number, payload: Partial<UserUpdatePayload>): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: UserUpdatePayload): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}`, payload);
  }

  /** PATCH /api/users/:id/password */
  changePassword(id: number, payload: ChangePasswordPayload): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}/password`, payload);
  }

  /** GET /api/users/:id/permissions → `{ permissions }` */
  permissions(id: number): Observable<EffectivePermission[]> {
    return this.http
      .get<{ permissions: EffectivePermission[] }>(`${this.base}/${id}/permissions`)
      .pipe(map((response) => response.permissions));
  }

  deactivate(id: number): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
