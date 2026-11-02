import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../../core/models/api.model';
import {
  Weighing,
  WeighingCreatePayload,
  WeighingUpdatePayload,
} from '../../core/models/weighing.model';

/** Contract of `/api/weighings`: lines of a collection; only gross and tare can change. */
@Injectable({ providedIn: 'root' })
export class WeighingApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/weighings`;

  list(): Observable<Weighing[]> {
    return this.http.get<{ weighings: Weighing[] }>(this.base).pipe(map((response) => response.weighings));
  }

  get(id: number): Observable<Weighing> {
    return this.http.get<Weighing>(`${this.base}/${id}`);
  }

  create(payload: WeighingCreatePayload): Observable<Weighing> {
    return this.http.post<Weighing>(this.base, payload);
  }

  update(id: number, payload: Partial<WeighingUpdatePayload>): Observable<Weighing> {
    return this.http.patch<Weighing>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: WeighingUpdatePayload): Observable<Weighing> {
    return this.http.put<Weighing>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<Weighing> {
    return this.http.patch<Weighing>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
