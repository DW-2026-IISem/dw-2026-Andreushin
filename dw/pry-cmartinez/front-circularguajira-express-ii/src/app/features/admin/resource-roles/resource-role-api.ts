import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ResourceRole,
  ResourceRoleFilters,
  ResourceRolePayload,
} from '../../../core/models/resource-role.model';

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
    return this.http
      .get<{ grants: ResourceRole[] }>(this.base, { params })
      .pipe(map((response) => response.grants));
  }

  get(id: number): Observable<ResourceRole> {
    return this.http.get<ResourceRole>(`${this.base}/${id}`);
  }

  /** Grants a resource to a role. */
  create(payload: ResourceRolePayload): Observable<ResourceRole> {
    return this.http.post<ResourceRole>(this.base, payload);
  }

  deactivate(id: number): Observable<ResourceRole> {
    return this.http.patch<ResourceRole>(`${this.base}/${id}/deactivate`, {});
  }

  reactivate(id: number): Observable<ResourceRole> {
    return this.http.patch<ResourceRole>(`${this.base}/${id}/reactivate`, {});
  }
}
