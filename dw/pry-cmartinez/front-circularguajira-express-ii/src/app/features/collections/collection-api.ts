import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../../core/models/api.model';
import {
  Collection,
  CollectionCreatePayload,
  CollectionUpdatePayload,
} from '../../core/models/collection.model';

/** Contract of `features/business/weighing` (collections): `{ collections }`, items unwrapped. */
@Injectable({ providedIn: 'root' })
export class CollectionApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/collections`;

  list(): Observable<Collection[]> {
    return this.http
      .get<{ collections: Collection[] }>(this.base)
      .pipe(map((response) => response.collections));
  }

  get(id: number): Observable<Collection> {
    return this.http.get<Collection>(`${this.base}/${id}`);
  }

  /** POST with its weighing lines; Express prices them with the rate in force on `collectedOn`. */
  create(payload: CollectionCreatePayload): Observable<Collection> {
    return this.http.post<Collection>(this.base, payload);
  }

  update(id: number, payload: Partial<CollectionUpdatePayload>): Observable<Collection> {
    return this.http.patch<Collection>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: CollectionUpdatePayload): Observable<Collection> {
    return this.http.put<Collection>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<Collection> {
    return this.http.patch<Collection>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
