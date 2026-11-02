import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../../core/models/api.model';
import { Recycler, RecyclerPayload, RecyclerUpdatePayload } from '../../core/models/recycler.model';

/** Exact contract of `features/business/collectors` in Express. */
@Injectable({ providedIn: 'root' })
export class RecyclerApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/recyclers`;

  /** GET /api/recyclers → `{ recyclers }`, unwrapped here. */
  list(): Observable<Recycler[]> {
    return this.http.get<{ recyclers: Recycler[] }>(this.base).pipe(map((response) => response.recyclers));
  }

  /** GET /api/recyclers/:id → the recycler itself (single items come unwrapped). */
  get(id: number): Observable<Recycler> {
    return this.http.get<Recycler>(`${this.base}/${id}`);
  }

  create(payload: RecyclerPayload): Observable<Recycler> {
    return this.http.post<Recycler>(this.base, payload);
  }

  /** PATCH /api/recyclers/:id — partial update (the one the form uses). */
  update(id: number, payload: Partial<RecyclerUpdatePayload>): Observable<Recycler> {
    return this.http.patch<Recycler>(`${this.base}/${id}`, payload);
  }

  /** PUT /api/recyclers/:id — full replacement. */
  replace(id: number, payload: RecyclerUpdatePayload): Observable<Recycler> {
    return this.http.put<Recycler>(`${this.base}/${id}`, payload);
  }

  /** Logical delete: status = inactive. */
  deactivate(id: number): Observable<Recycler> {
    return this.http.patch<Recycler>(`${this.base}/${id}/deactivate`, {});
  }

  /** Physical delete: DELETE → `{ message }`. */
  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
