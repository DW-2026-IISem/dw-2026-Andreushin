import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../../core/models/api.model';
import { Material, MaterialPayload, MaterialUpdatePayload } from '../../core/models/material.model';
import { MaterialRate, MaterialRatePayload } from '../../core/models/material-rate.model';

/** Contract of `features/business/materials` (materials and their rate history). */
@Injectable({ providedIn: 'root' })
export class MaterialApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/materials`;

  list(): Observable<Material[]> {
    return this.http.get<{ materials: Material[] }>(this.base).pipe(map((response) => response.materials));
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

  /** GET /api/materials/:id/rates → `{ rates }` (history). */
  rates(id: number): Observable<MaterialRate[]> {
    return this.http
      .get<{ rates: MaterialRate[] }>(`${this.base}/${id}/rates`)
      .pipe(map((response) => response.rates));
  }

  /** GET /api/materials/:id/rates/current?date=YYYY-MM-DD → the rate in force that day. */
  currentRate(id: number, date?: string): Observable<MaterialRate> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<MaterialRate>(`${this.base}/${id}/rates/current`, { params });
  }

  /** POST /api/materials/:id/rates — rates are never edited: a new one is issued. */
  addRate(id: number, payload: MaterialRatePayload): Observable<MaterialRate> {
    return this.http.post<MaterialRate>(`${this.base}/${id}/rates`, payload);
  }
}
