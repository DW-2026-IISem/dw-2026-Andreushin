import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ResourceRole,
  ResourceRoleFilters,
  ResourceRolePayload,
  ResourceRoleReconcileResult,
} from '../../../../core/models/resource-role.model';

const RESULT_FIELDS = ['roleId', 'activated', 'deactivated', 'totalActive'] as const;

/** The reconcile answer must carry `result` with its four counters; anything else is an error. */
function requiredReconcileResult(response: {
  result?: Partial<ResourceRoleReconcileResult>;
}): ResourceRoleReconcileResult {
  const result = response?.result;
  if (!result || RESULT_FIELDS.some((field) => typeof result[field] !== 'number')) {
    throw new Error('Respuesta inesperada del servidor: falta result al guardar los permisos.');
  }
  return result as ResourceRoleReconcileResult;
}

/** Pivot `resource_roles`: query filters and the `{ grants }` wrapper, NOT `{ resource_roles }`. */
@Injectable({ providedIn: 'root' })
export class ResourceRoleApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/resource-roles`;

  list(filters?: ResourceRoleFilters): Observable<ResourceRole[]> {
    let params = new HttpParams();
    if (filters?.roleId) {
      params = params.set('roleId', filters.roleId);
    }
    if (filters?.resourceId) {
      params = params.set('resourceId', filters.resourceId);
    }
    return this.http.get<{ grants?: ResourceRole[] }>(this.base, { params }).pipe(
      map((response) => {
        if (!Array.isArray(response?.grants)) {
          throw new Error('Respuesta inesperada del servidor: falta grants.');
        }
        return response.grants;
      }),
    );
  }

  get(id: number): Observable<ResourceRole> {
    return this.http.get<ResourceRole>(`${this.base}/${id}`);
  }

  /** Grants a resource to a role. */
  create(payload: ResourceRolePayload): Observable<ResourceRole> {
    return this.http.post<ResourceRole>(this.base, payload);
  }

  /**
   * Saves the whole matrix of a role: it ends up with EXACTLY `resourceIds` (an empty list
   * revokes everything). One request, one transaction; the answer is `{ message, result }`.
   */
  reconcile(roleId: number, resourceIds: number[]): Observable<ResourceRoleReconcileResult> {
    return this.http
      .post<{ result?: Partial<ResourceRoleReconcileResult> }>(`${this.base}/reconcile`, {
        roleId,
        resourceIds,
      })
      .pipe(map((response) => requiredReconcileResult(response)));
  }

  deactivate(id: number): Observable<ResourceRole> {
    return this.http.patch<ResourceRole>(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: number): Observable<ResourceRole> {
    return this.http.patch<ResourceRole>(`${this.base}/${id}/reactivate`, {});
  }
}
