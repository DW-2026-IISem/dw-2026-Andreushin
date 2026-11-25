import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { MaterialRate, MaterialRatePayload } from '../../../../../core/models/material-rate.model';

/** Contract of `/materials/:id/rates` in Express: append-only rate history of a material. */
@Injectable({ providedIn: 'root' })
export class MaterialRateApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/materials`;

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
