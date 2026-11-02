import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiMessage } from '../../../core/models/api.model';
import { Resource, ResourcePayload, ResourceUpdatePayload } from '../../../core/models/resource.model';

/** Contract of `/resources` in Express: lists wrapped as `{ resources }`, single items unwrapped. */
@Injectable({ providedIn: 'root' })
export class ResourceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/resources`;

  list(): Observable<Resource[]> {
    return this.http.get<{ resources: Resource[] }>(this.base).pipe(map((response) => response.resources));
  }

  get(id: number): Observable<Resource> {
    return this.http.get<Resource>(`${this.base}/${id}`);
  }

  create(payload: ResourcePayload): Observable<Resource> {
    return this.http.post<Resource>(this.base, payload);
  }

  update(id: number, payload: Partial<ResourceUpdatePayload>): Observable<Resource> {
    return this.http.patch<Resource>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: ResourceUpdatePayload): Observable<Resource> {
    return this.http.put<Resource>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<Resource> {
    return this.http.patch<Resource>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
