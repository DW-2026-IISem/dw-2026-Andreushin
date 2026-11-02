import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage } from '../../core/models/api.model';
import {
  Settlement,
  SettlementCreatePayload,
  SettlementNotesPayload,
  SettlementVerification,
} from '../../core/models/settlement.model';

/** Contract of `features/business/settlements`: amounts are frozen; only notes change. */
@Injectable({ providedIn: 'root' })
export class SettlementApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/settlements`;

  list(): Observable<Settlement[]> {
    return this.http
      .get<{ settlements: Settlement[] }>(this.base)
      .pipe(map((response) => response.settlements));
  }

  get(id: number): Observable<Settlement> {
    return this.http.get<Settlement>(`${this.base}/${id}`);
  }

  /** GET /api/settlements/:id/verify — recomputes every line and compares it with the stored totals. */
  verify(id: number): Observable<SettlementVerification> {
    return this.http.get<SettlementVerification>(`${this.base}/${id}/verify`);
  }

  /** POST: settles one collection (confirms rates and freezes the totals). */
  create(payload: SettlementCreatePayload): Observable<Settlement> {
    return this.http.post<Settlement>(this.base, payload);
  }

  updateNotes(id: number, payload: SettlementNotesPayload): Observable<Settlement> {
    return this.http.patch<Settlement>(`${this.base}/${id}`, payload);
  }

  /** PATCH /api/settlements/:id/void — a wrong settlement is voided and issued again. */
  void(id: number): Observable<Settlement> {
    return this.http.patch<Settlement>(`${this.base}/${id}/void`, {});
  }

  /** DELETE: only a voided settlement can be removed. */
  remove(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.base}/${id}`);
  }
}
