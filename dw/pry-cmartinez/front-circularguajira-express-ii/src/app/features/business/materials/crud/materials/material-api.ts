import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { ApiMessage } from '../../../../../core/models/api.model';
import {
  Material,
  MaterialPayload,
  MaterialUpdatePayload,
} from '../../../../../core/models/material.model';

/** Contract of `/materials` in Express (the rate history lives in `material-rate-api.ts`). */
@Injectable({ providedIn: 'root' })
export class MaterialApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/materials`;

  list(): Observable<Material[]> {
    return this.http
      .get<{ materials: Material[] }>(this.base)
      .pipe(map((response) => response.materials));
  }

  get(id: number): Observable<Material> {
    return this.http.get<Material>(`${this.base}/${id}`);
  }

  create(payload: MaterialPayload): Observable<Material> {
    return this.http.post<Material>(this.base, payload);
  }

  update(id: number, payload: Partial<MaterialUpdatePayload>): Observable<Material> {
    return this.http.patch<Material>(`${this.base}/${id}`, payload);
  }

  replace(id: number, payload: MaterialUpdatePayload): Observable<Material> {
    return this.http.put<Material>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<Material> {
    return this.http.patch<Material>(`${this.base}/${id}/deactivate`, {});
  }

  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
