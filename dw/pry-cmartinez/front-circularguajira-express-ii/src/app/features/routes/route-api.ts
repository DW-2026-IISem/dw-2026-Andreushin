import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../../core/models/api.model';
import { CollectionPoint } from '../../core/models/collection-point.model';
import { Route, RoutePayload, RouteUpdatePayload } from '../../core/models/route.model';

/** Contract of `/routes` in Express: lists wrapped as `{ routes }`, single items unwrapped. */
@Injectable({ providedIn: 'root' })
export class RouteApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/routes`;

  list(): Observable<Route[]> {
    return this.http.get<{ routes: Route[] }>(this.base).pipe(map((response) => response.routes));
  }

  /** GET /api/routes/:id/points → `{ points }`, ordered by visit. */
  points(id: number): Observable<CollectionPoint[]> {
    return this.http
      .get<{ points: CollectionPoint[] }>(`${this.base}/${id}/points`)
      .pipe(map((response) => response.points));
  }

  get(id: number): Observable<Route> {
    return this.http.get<Route>(`${this.base}/${id}`);
  }

  create(payload: RoutePayload): Observable<Route> {
    return this.http.post<Route>(this.base, payload);
  }

  update(id: number, payload: Partial<RouteUpdatePayload>): Observable<Route> {
    return this.http.patch<Route>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: RouteUpdatePayload): Observable<Route> {
    return this.http.put<Route>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<Route> {
    return this.http.patch<Route>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
