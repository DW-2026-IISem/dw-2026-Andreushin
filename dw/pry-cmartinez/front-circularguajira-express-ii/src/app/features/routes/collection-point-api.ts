import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../../core/models/api.model';
import { CollectionPoint, CollectionPointPayload, CollectionPointUpdatePayload } from '../../core/models/collection-point.model';

/** Contract of `/collection-points` in Express: lists wrapped as `{ points }`, single items unwrapped. */
@Injectable({ providedIn: 'root' })
export class CollectionPointApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/collection-points`;

  list(): Observable<CollectionPoint[]> {
    return this.http.get<{ points: CollectionPoint[] }>(this.base).pipe(map((response) => response.points));
  }

  get(id: number): Observable<CollectionPoint> {
    return this.http.get<CollectionPoint>(`${this.base}/${id}`);
  }

  create(payload: CollectionPointPayload): Observable<CollectionPoint> {
    return this.http.post<CollectionPoint>(this.base, payload);
  }

  update(id: number, payload: Partial<CollectionPointUpdatePayload>): Observable<CollectionPoint> {
    return this.http.patch<CollectionPoint>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: CollectionPointUpdatePayload): Observable<CollectionPoint> {
    return this.http.put<CollectionPoint>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<CollectionPoint> {
    return this.http.patch<CollectionPoint>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
